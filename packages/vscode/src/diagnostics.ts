import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, resolve as pathResolve } from 'node:path';
import { Diagnostic, DiagnosticSeverity, type OutputChannel, Position, Range, Uri } from 'vscode';

export interface CheckOptions {
    binaryPath: string;
    filePath: string;
    workspaceRoot: string | undefined;
    includeDirs: string[];
    tlConfigPath: string | undefined;
    outputChannel: OutputChannel;
}

interface TealDiagnostic {
    file: string;
    line: number;
    col: number;
    severity: DiagnosticSeverity;
    message: string;
}

// Matches tl's actual output: file.tl:LINE:COL: message
// tl does NOT inline a severity word — severity is determined by which
// section the line appears in ("N warning(s)" / "N error(s)" header).
const DIAG_LINE_PATTERN = /^(.+\.tl):(\d+):(\d+):\s+(.+)$/;

// Section headers that tell us what severity the following lines are
const WARNING_SECTION = /^\d+\s+warning/i;
const ERROR_SECTION = /^\d+\s+error/i;

/**
 * Parses tl's stderr output into structured diagnostics.
 *
 * tl groups diagnostics under section headers:
 *   "1 warning:" / "2 warnings:"  -> warnings follow
 *   "1 error:"   / "2 errors:"    -> errors follow
 */
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

/**
 * Runs `tl check` on a file and returns a map of URI -> diagnostics.
 * May return diagnostics for multiple files if the checked file has dependencies.
 */
export async function runCheck(options: CheckOptions): Promise<Map<string, Diagnostic[]>> {
    const { binaryPath, filePath, workspaceRoot, includeDirs, tlConfigPath, outputChannel } =
        options;

    const args: string[] = ['check'];

    for (const dir of includeDirs) {
        args.push('--include-dir', dir);
    }

    if (tlConfigPath && existsSync(tlConfigPath)) {
        args.push('--config', tlConfigPath);
    }

    args.push(filePath);

    const cwd = workspaceRoot ?? dirname(filePath);
    outputChannel.appendLine(`[@tlfx/vscode] $ ${binaryPath} ${args.join(' ')}`);
    outputChannel.appendLine(`[@tlfx/vscode] cwd: ${cwd}`);

    return new Promise((resolve) => {
        const proc = spawn(binaryPath, args, {
            cwd,
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

        proc.on('close', (code) => {
            outputChannel.appendLine(`[@tlfx/vscode] exit code: ${code}`);
            if (stdout) outputChannel.appendLine(`[@tlfx/vscode] stdout: ${stdout.trim()}`);
            if (stderr) outputChannel.appendLine(`[@tlfx/vscode] stderr: ${stderr.trim()}`);

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
