import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve as pathResolve } from 'node:path';
import { Diagnostic, DiagnosticSeverity, type OutputChannel, Position, Range, Uri } from 'vscode';

export interface CheckOptions {
    binaryPath: string;
    filePath: string;
    workspaceRoot: string | undefined;
    includeDirs: string[];
    globalEnvDef: string | null;
    outputChannel: OutputChannel;
}

interface TealDiagnostic {
    file: string;
    line: number;
    col: number;
    severity: DiagnosticSeverity;
    message: string;
}

const DIAG_LINE_PATTERN = /^(.+\.tl):(\d+):(\d+):\s+(.+)$/;
const WARNING_SECTION = /^\d+\s+warning/i;
const ERROR_SECTION = /^\d+\s+error/i;

/**
 * Scans forward from `col` in the given source line to find the length of the
 * token at that position. Handles:
 *   - identifiers:       [A-Za-z_][A-Za-z0-9_]*
 *   - integer literals:  [0-9]+
 *   - float literals:    [0-9]+\.[0-9]*  or  [0-9]*\.[0-9]+
 *   - hex literals:      0x[0-9A-Fa-f]+
 *   - string literals:   "..." or '...' (single-line, escaped chars handled)
 *   - falls back to 1 for anything else
 */
function measureToken(sourceLine: string, col: number): number {
    if (col >= sourceLine.length) return 1;

    const ch = sourceLine[col];

    if (ch === '"' || ch === "'") {
        const quote = ch;
        let i = col + 1;

        while (i < sourceLine.length) {
            if (sourceLine[i] === '\\') {
                i += 2;
            } else if (sourceLine[i] === quote) {
                return i - col + 1;
            } else {
                i++;
            }
        }

        return sourceLine.length - col;
    }

    if (ch === '0' && sourceLine[col + 1]?.toLowerCase() === 'x') {
        let i = col + 2;
        while (i < sourceLine.length && /[0-9A-Fa-f_]/.test(sourceLine[i])) i++;
        return i - col;
    }

    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(sourceLine[col + 1] ?? ''))) {
        let i = col;
        while (i < sourceLine.length && /[0-9]/.test(sourceLine[i])) i++;

        if (sourceLine[i] === '.') {
            i++;
            while (i < sourceLine.length && /[0-9]/.test(sourceLine[i])) i++;
        }

        if (sourceLine[i]?.toLowerCase() === 'e') {
            i++;
            if (sourceLine[i] === '+' || sourceLine[i] === '-') i++;
            while (i < sourceLine.length && /[0-9]/.test(sourceLine[i])) i++;
        }

        return i - col;
    }

    if (/[A-Za-z_]/.test(ch)) {
        let i = col + 1;
        while (i < sourceLine.length && /[A-Za-z0-9_]/.test(sourceLine[i])) i++;

        return i - col;
    }

    return 1;
}

/**
 * Cache of file contents keyed by absolute path, populated on first access.
 * Cleared between check runs so edits are picked up.
 */
const sourceCache = new Map<string, string[]>();

function getSourceLines(filePath: string): string[] {
    if (!sourceCache.has(filePath)) {
        try {
            const content = readFileSync(filePath, 'utf8');
            sourceCache.set(filePath, content.split('\n'));
        } catch {
            sourceCache.set(filePath, []);
        }
    }

    return sourceCache.get(filePath)!;
}

function parseTealOutput(output: string): TealDiagnostic[] {
    const diagnostics: TealDiagnostic[] = [];
    let currentSeverity: DiagnosticSeverity = DiagnosticSeverity.Error;

    for (const line of output.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (WARNING_SECTION.test(trimmed)) {
            currentSeverity = DiagnosticSeverity.Warning;
            continue;
        }
        if (ERROR_SECTION.test(trimmed)) {
            currentSeverity = DiagnosticSeverity.Error;
            continue;
        }

        const match = DIAG_LINE_PATTERN.exec(trimmed);
        if (!match) continue;

        const [, file, lineStr, colStr, message] = match;

        diagnostics.push({
            file,
            line: parseInt(lineStr, 10) - 1,
            col: parseInt(colStr, 10) - 1,
            severity: currentSeverity,
            message
        });
    }

    return diagnostics;
}

export async function runCheck(options: CheckOptions): Promise<Map<string, Diagnostic[]>> {
    const { binaryPath, filePath, workspaceRoot, includeDirs, globalEnvDef, outputChannel } =
        options;

    sourceCache.clear();

    const args: string[] = ['check'];

    for (const dir of includeDirs) {
        args.push('--include-dir', dir);
    }

    if (globalEnvDef) {
        args.push('--global-env-def', globalEnvDef);
    }

    args.push(filePath);

    const cwd = workspaceRoot ?? dirname(filePath);
    outputChannel.appendLine(`[@tlfx/vscode] $ ${binaryPath} ${args.join(' ')}`);
    outputChannel.appendLine(`[@tlfx/vscode] cwd: ${cwd}`);

    return new Promise((resolve) => {
        const proc = spawn(binaryPath, args, { cwd, env: process.env });

        let stdout = '';
        let stderr = '';

        proc.stdout?.on('data', (chunk: Buffer) => {
            stdout += chunk.toString();
        });

        proc.stderr?.on('data', (chunk: Buffer) => {
            stderr += chunk.toString();
        });

        proc.on('close', (code) => {
            outputChannel.appendLine(`[@tlfx/vscode] exit code: ${code}`);
            if (stdout) outputChannel.appendLine(`[@tlfx/vscode] stdout: ${stdout.trim()}`);
            if (stderr) outputChannel.appendLine(`[@tlfx/vscode] stderr: ${stderr.trim()}`);

            const parsed = parseTealOutput(stderr + stdout);
            const resultMap = new Map<string, Diagnostic[]>();

            for (const d of parsed) {
                const absPath = isAbsolute(d.file)
                    ? d.file
                    : pathResolve(workspaceRoot ?? dirname(filePath), d.file);

                const uri = Uri.file(absPath).toString();
                if (!resultMap.has(uri)) resultMap.set(uri, []);

                const sourceLines = getSourceLines(absPath);
                const sourceLine = sourceLines[d.line] ?? '';
                const tokenLen = measureToken(sourceLine, d.col);

                const range = new Range(
                    new Position(d.line, d.col),
                    new Position(d.line, d.col + tokenLen)
                );

                const diag = new Diagnostic(range, d.message, d.severity);
                diag.source = 'teal';
                resultMap.get(uri)?.push(diag);
            }

            resolve(resultMap);
        });

        proc.on('error', (err) => {
            outputChannel.appendLine(`[@tlfx/vscode] spawn error: ${err.message}`);

            const uri = Uri.file(filePath).toString();
            const diag = new Diagnostic(
                new Range(0, 0, 0, 0),
                `Failed to run tl binary: ${err.message}`,
                DiagnosticSeverity.Error
            );

            diag.source = 'teal';
            resolve(new Map([[uri, [diag]]]));
        });
    });
}
