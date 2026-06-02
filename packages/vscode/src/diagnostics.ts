import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, resolve as pathResolve } from 'node:path';
import { Diagnostic, DiagnosticSeverity, Position, Range, Uri } from 'vscode';

export interface CheckOptions {
    binaryPath: string;
    filePath: string;
    workspaceRoot: string | undefined;
    includeDirs: string[];
    tlConfigPath: string | undefined;
}

/**
 * Parsed representation of a single tl error/warning line.
 * tl outputs lines in the format:
 *   filename.tl:LINE:COL: <type>: message
 */
interface TealDiagnostic {
    file: string;
    line: number;
    col: number;
    severity: DiagnosticSeverity;
    message: string;
}

// Matches: path/to/file.tl:10:5: error: some message
//      or: path/to/file.tl:10:5: warning: some message
const DIAG_PATTERN = /^(.+\.tl):(\d+):(\d+):\s+(error|warning|unknown symbol):\s+(.+)$/;

/**
 * Parses tl's stderr/stdout output into structured diagnostics.
 */
function parseTealOutput(output: string): TealDiagnostic[] {
    const diagnostics: TealDiagnostic[] = [];

    for (const line of output.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const match = DIAG_PATTERN.exec(trimmed);
        if (!match) continue;

        const [, file, lineStr, colStr, severityStr, message] = match;

        let severity: DiagnosticSeverity;
        if (severityStr === 'warning') {
            severity = DiagnosticSeverity.Warning;
        } else {
            severity = DiagnosticSeverity.Error;
        }

        diagnostics.push({
            file,
            line: parseInt(lineStr, 10) - 1, // VSCode is 0-indexed
            col: parseInt(colStr, 10) - 1,
            severity,
            message
        });
    }

    return diagnostics;
}

/**
 * Runs `tl check` on a file and returns a map of URI -> diagnostics.
 * May return diagnostics for multiple files if the checked file has dependencies.
 */
export async function runCheck(options: CheckOptions): Promise<Map<string, Diagnostic[]>> {
    const { binaryPath, filePath, workspaceRoot, includeDirs, tlConfigPath } = options;

    const args: string[] = ['check'];

    for (const dir of includeDirs) {
        args.push('--include-dir', dir);
    }

    if (tlConfigPath && existsSync(tlConfigPath)) {
        args.push('--config', tlConfigPath);
    }

    args.push(filePath);

    return new Promise((resolve) => {
        const proc = spawn(binaryPath, args, {
            cwd: workspaceRoot ?? dirname(filePath),
            env: process.env
        });

        let stdout = '';
        let stderr = '';

        proc.stdout?.on('data', (chunk: Buffer) => {
            stdout += chunk.toString();
        });

        proc.stderr?.on('data', (chunk: Buffer) => {
            stderr += chunk.toString();
        });

        proc.on('close', () => {
            const combined = stderr + stdout;
            const parsed = parseTealOutput(combined);
            const resultMap = new Map<string, Diagnostic[]>();

            for (const d of parsed) {
                const absPath = isAbsolute(d.file)
                    ? d.file
                    : pathResolve(workspaceRoot ?? dirname(filePath), d.file);

                const uri = Uri.file(absPath).toString();

                if (!resultMap.has(uri)) {
                    resultMap.set(uri, []);
                }

                const range = new Range(
                    new Position(d.line, d.col),
                    new Position(d.line, d.col + 1)
                );

                const diag = new Diagnostic(range, d.message, d.severity);

                diag.source = 'teal';
                resultMap.get(uri)?.push(diag);
            }

            resolve(resultMap);
        });

        proc.on('error', (err) => {
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
