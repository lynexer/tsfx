import { spawn } from 'node:child_process';
import {
    closeSync,
    existsSync,
    openSync,
    readFileSync,
    unlinkSync,
    writeFileSync,
    writeSync
} from 'node:fs';
import { dirname, isAbsolute, join, parse, resolve as pathResolve } from 'node:path';
import { Diagnostic, DiagnosticSeverity, type OutputChannel, Position, Range, Uri } from 'vscode';

export interface CheckOptions {
    binaryPath: string;
    filePath: string;
    fileText: string;
    workspaceRoot: string | undefined;
    fivemTypesDir: string | null;
    globalEnvDef: string | null;
    outputChannel: OutputChannel;
}

interface TealDiagnostic {
    file: string;
    line: number;
    col: number;
    isWarning: boolean;
    message: string;
}

const DIAG_LINE_PATTERN = /^(.+):(\d+):(\d+):\s+(.+)$/;
const WARNING_SECTION = /^\d+\s+warning/i;
const ERROR_SECTION = /^\d+\s+error/i;
const TMP_PREFIX = '__tl__tmp__check-';
const TMP_COMBINED_PREFIX = '__tl__tmp__combined-';

// ---------------------------------------------------------------------------
// Token measurement for underline ranges
// ---------------------------------------------------------------------------

function measureToken(sourceLine: string, col: number): number {
    if (col >= sourceLine.length) return 1;
    const ch = sourceLine[col];

    if (ch === '"' || ch === "'") {
        const quote = ch;
        let i = col + 1;

        while (i < sourceLine.length) {
            if (sourceLine[i] === '\\') i += 2;
            else if (sourceLine[i] === quote) return i - col + 1;
            else i++;
        }

        return sourceLine.length - col;
    }

    if (/[A-Za-z_]/.test(ch)) {
        let i = col + 1;
        while (i < sourceLine.length && /[A-Za-z0-9_]/.test(sourceLine[i])) i++;

        return i - col;
    }

    if (/[0-9]/.test(ch)) {
        let i = col;
        while (i < sourceLine.length && /[0-9.]/.test(sourceLine[i])) i++;

        return i - col;
    }

    return 1;
}

// ---------------------------------------------------------------------------
// tlconfig.lua discovery
// ---------------------------------------------------------------------------

function findTlConfigDir(filePath: string): string | null {
    let dir = dirname(filePath);
    const root = parse(dir).root;

    while (true) {
        if (existsSync(join(dir, 'tlconfig.lua'))) return dir;
        const parent = dirname(dir);
        if (parent === dir || dir === root) break;
        dir = parent;
    }

    return null;
}

// ---------------------------------------------------------------------------
// Merged tlconfig + combined .d.tl generation
// ---------------------------------------------------------------------------

interface MergeResult {
    config: string;
    combinedDtlPath: string | null;
}

/**
 * Builds a merged tlconfig.lua that adds our FiveM types alongside the
 * project's existing config.
 *
 * Since tl only supports one global_env_def, when the project already has one
 * we create a combined .d.tl in sourceDir that concatenates both files, then
 * point global_env_def at that combined file.
 */
function buildMergedConfig(
    existingConfig: string | null,
    configDir: string,
    sourceDir: string,
    fivemTypesDir: string,
    fivemEnvDef: string
): MergeResult {
    const fivemDirFwd = fivemTypesDir.replace(/\\/g, '/');

    let projectEnvDef: string | null = null;
    if (existingConfig) {
        const m = existingConfig.match(/global_env_def\s*=\s*["']([^"']+)["']/);
        if (m) projectEnvDef = m[1];
    }

    let finalEnvDef = fivemEnvDef;
    let combinedDtlPath: string | null = null;

    if (projectEnvDef && projectEnvDef !== fivemEnvDef) {
        const fivemDtlPath = join(fivemTypesDir, `${fivemEnvDef}.d.tl`);

        let projectDtlContent = '';

        if (existingConfig) {
            const m = existingConfig.match(/include_dir\s*=\s*\{([^}]*)\}/s);

            if (m) {
                const dirs = (m[1].match(/["']([^"']+)["']/g) ?? []).map((d) =>
                    d.replace(/["']/g, '')
                );

                for (const dir of dirs) {
                    const candidate = join(configDir, dir, `${projectEnvDef}.d.tl`);

                    if (existsSync(candidate)) {
                        projectDtlContent = readFileSync(candidate, 'utf8');
                        break;
                    }
                }
            }
        }

        let fivemDtlContent = '';
        if (existsSync(fivemDtlPath)) {
            fivemDtlContent = readFileSync(fivemDtlPath, 'utf8');
        }

        const combinedContent = [projectDtlContent, fivemDtlContent].filter(Boolean).join('\n\n');

        const combinedName = `${TMP_COMBINED_PREFIX}${Date.now()}`;

        combinedDtlPath = join(sourceDir, `${combinedName}.d.tl`);
        writeFileSync(combinedDtlPath, combinedContent, 'utf8');

        finalEnvDef = combinedName;
    }

    let config: string;

    if (existingConfig) {
        config = `${[
            `-- Temporarily modified by @tlfx/vscode. Do not edit.`,
            `local _cfg = (function()`,
            existingConfig.trim(),
            `end)()`,
            `_cfg.include_dir = _cfg.include_dir or {}`,
            `table.insert(_cfg.include_dir, "${fivemDirFwd}")`,
            `_cfg.global_env_def = "${finalEnvDef}"`,
            `return _cfg`
        ].join('\n')}\n`;
    } else {
        config = `${[
            `-- Auto-generated by @tlfx/vscode. Do not edit.`,
            `return {`,
            `  include_dir = { "${fivemDirFwd}" },`,
            `  global_env_def = "${finalEnvDef}",`,
            `}`
        ].join('\n')}\n`;
    }

    return { config, combinedDtlPath };
}

// ---------------------------------------------------------------------------
// Output parsing
// ---------------------------------------------------------------------------

function parseTealOutput(output: string): TealDiagnostic[] {
    const diagnostics: TealDiagnostic[] = [];
    let isWarning = false;

    for (const line of output.split('\n')) {
        const trimmed = line.trim();

        if (!trimmed) continue;
        if (WARNING_SECTION.test(trimmed)) {
            isWarning = true;
            continue;
        }
        if (ERROR_SECTION.test(trimmed)) {
            isWarning = false;
            continue;
        }

        const match = DIAG_LINE_PATTERN.exec(trimmed);
        if (!match) continue;

        const [, file, lineStr, colStr, message] = match;

        diagnostics.push({
            file,
            line: parseInt(lineStr, 10) - 1,
            col: parseInt(colStr, 10) - 1,
            isWarning,
            message
        });
    }

    return diagnostics;
}

// ---------------------------------------------------------------------------
// Main check runner
// ---------------------------------------------------------------------------

export async function runCheck(options: CheckOptions): Promise<Map<string, Diagnostic[]>> {
    const {
        binaryPath,
        filePath,
        fileText,
        workspaceRoot,
        fivemTypesDir,
        globalEnvDef,
        outputChannel
    } = options;

    const sourceDir = dirname(filePath);
    const cwd = findTlConfigDir(filePath) ?? workspaceRoot ?? sourceDir;

    const tmpFile = join(sourceDir, `${TMP_PREFIX}${Date.now()}.tl`);
    const fd = openSync(tmpFile, 'w');
    writeSync(fd, fileText, 0, 'utf8');
    closeSync(fd);

    const tlConfigPath = join(cwd, 'tlconfig.lua');
    const originalConfig = existsSync(tlConfigPath) ? readFileSync(tlConfigPath, 'utf8') : null;

    let combinedDtlPath: string | null = null;

    if (fivemTypesDir && globalEnvDef) {
        const result = buildMergedConfig(
            originalConfig,
            cwd,
            sourceDir,
            fivemTypesDir,
            globalEnvDef
        );

        combinedDtlPath = result.combinedDtlPath;
        writeFileSync(tlConfigPath, result.config, 'utf8');
        outputChannel.appendLine(`[@tlfx/vscode] merged tlconfig:\n${result.config}`);
    }

    const fileArg = process.platform === 'win32' ? `"${tmpFile}"` : tmpFile;
    const args = ['check', '--quiet', fileArg];

    outputChannel.appendLine(`[@tlfx/vscode] $ ${binaryPath} ${args.join(' ')}`);
    outputChannel.appendLine(`[@tlfx/vscode] cwd: ${cwd}`);

    function cleanup() {
        try {
            unlinkSync(tmpFile);
        } catch {
            /* best effort */
        }

        if (combinedDtlPath)
            try {
                unlinkSync(combinedDtlPath);
            } catch {}

        try {
            if (originalConfig !== null) {
                writeFileSync(tlConfigPath, originalConfig, 'utf8');
            } else if (fivemTypesDir && globalEnvDef) {
                unlinkSync(tlConfigPath);
            }
        } catch {}
    }

    return new Promise((resolve) => {
        const proc = spawn(binaryPath, args, {
            cwd,
            env: process.env,
            shell: process.platform === 'win32'
        });

        let stdout = '';
        let stderr = '';
        proc.stdout?.on('data', (d: Buffer) => {
            stdout += d.toString();
        });
        proc.stderr?.on('data', (d: Buffer) => {
            stderr += d.toString();
        });

        proc.on('close', (code) => {
            cleanup();

            outputChannel.appendLine(`[@tlfx/vscode] exit code: ${code}`);
            if (stderr) outputChannel.appendLine(`[@tlfx/vscode] stderr: ${stderr.trim()}`);

            const parsed = parseTealOutput(stderr + stdout);
            const resultMap = new Map<string, Diagnostic[]>();

            for (const d of parsed) {
                const isTmp = d.file.includes(TMP_PREFIX);
                const resolvedFile = isTmp
                    ? filePath
                    : isAbsolute(d.file)
                      ? d.file
                      : pathResolve(cwd, d.file);

                const message = d.message.replace(tmpFile, filePath);
                const uri = Uri.file(resolvedFile).toString();
                if (!resultMap.has(uri)) resultMap.set(uri, []);

                let sourceLine = '';
                try {
                    sourceLine = readFileSync(resolvedFile, 'utf8').split('\n')[d.line] ?? '';
                } catch {}

                const tokenLen = measureToken(sourceLine, d.col);
                const range = new Range(
                    new Position(d.line, d.col),
                    new Position(d.line, d.col + tokenLen)
                );
                const severity = d.isWarning
                    ? DiagnosticSeverity.Warning
                    : DiagnosticSeverity.Error;
                const diag = new Diagnostic(range, message, severity);
                diag.source = 'teal';
                resultMap.get(uri)?.push(diag);
            }

            resolve(resultMap);
        });

        proc.on('error', (err) => {
            cleanup();
            outputChannel.appendLine(`[@tlfx/vscode] spawn error: ${err.message}`);
            resolve(
                new Map([
                    [
                        Uri.file(filePath).toString(),
                        [
                            Object.assign(
                                new Diagnostic(
                                    new Range(0, 0, 0, 0),
                                    `Failed to run tl: ${err.message}`,
                                    DiagnosticSeverity.Error
                                ),
                                { source: 'teal' }
                            )
                        ]
                    ]
                ])
            );
        });
    });
}
