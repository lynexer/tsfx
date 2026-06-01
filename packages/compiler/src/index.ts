import { execFile } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { PLATFORM_MAP } from './constants';
import { readTlConfig } from './tlconfig';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));

export interface CompileResult {
    ok: boolean;
    output: string;
    outFile?: string;
}

export interface CompileOptions {
    outDir?: string;
}

/**
 * Resolves the path to the tl binary.
 * Respects TL_BINARY env override, then falls back to the bundled binary.
 */
export function getTlBinary(): string {
    if (process.env.TL_BINARY) return process.env.TL_BINARY;

    const platformKey = `${process.platform}-${process.arch}`;
    const platformInfo = PLATFORM_MAP[platformKey];

    if (!platformInfo) {
        throw new Error(
            `[@tlfx/compiler] No bundled tl binary for ${platformKey}. ` +
                `Set TL_BINARY=/path/to/tl in your environment.`
        );
    }

    const bundled = join(__dirname, '..', 'bin', platformInfo.exe);
    if (!existsSync(bundled)) {
        throw new Error(
            `[@tlfx/compiler] Binary not found at ${bundled}. ` +
                `Try reinstalling the package or set TL_BINARY=/path/to/tl.`
        );
    }

    return bundled;
}

/**
 * Type-checks a .tl file without emitting output.
 */
export async function check(filePath: string): Promise<CompileResult> {
    const tl = getTlBinary();
    try {
        const { stdout, stderr } = await execFileAsync(tl, ['check', filePath]);
        return { ok: true, output: stdout + stderr };
    } catch (err: unknown) {
        const e = err as { stdout?: string; stderr?: string };
        return { ok: false, output: (e.stdout ?? '') + (e.stderr ?? '') };
    }
}

/**
 * Compiles a .tl file to a .lua file suitable for cfxlua (FiveM).
 *
 * Uses `tl gen` which strips all type annotations and outputs plain Lua 5.4.
 * CfxLua-specific extensions (vectors, backtick hashes) are runtime globals
 * and don't affect the compilation step.
 */
export async function compile(
    filePath: string,
    options: CompileOptions = {}
): Promise<CompileResult> {
    const tl = getTlBinary();
    const args = ['gen', filePath];

    if (options.outDir) {
        args.push('--output-dir', options.outDir);
    }

    try {
        const { stdout, stderr } = await execFileAsync(tl, args);
        const outFile = options.outDir
            ? filePath.replace(/\.tl$/, '.lua').replace(/^.*[\\/]/, `${options.outDir}/`)
            : filePath.replace(/\.tl$/, '.lua');

        return { ok: true, output: stdout + stderr, outFile };
    } catch (err: unknown) {
        const e = err as { stdout?: string; stderr?: string };
        return { ok: false, output: (e.stdout ?? '') + (e.stderr ?? '') };
    }
}

/**
 * Replicates `cyan build` / `tl build` by reading tlconfig.lua and calling
 * `tl gen` on each listed source file. This avoids needing Cyan or LuaRocks.
 */
export async function build(cwd: string = process.cwd()): Promise<CompileResult> {
    const config = readTlConfig(cwd);

    const sourceDir = config.source_dir ?? '.';
    const buildDir = config.build_dir ?? '.';
    const files = config.files ?? [];

    if (files.length === 0) {
        return {
            ok: false,
            output: '[@tlfx/compiler] No files listed in tlconfig.lua.\n'
        };
    }

    const outDir = join(cwd, buildDir);
    mkdirSync(outDir, { recursive: true });

    const results = await Promise.all(
        files.map((file) => {
            const fullPath = join(cwd, sourceDir, file);
            return compile(fullPath, { outDir });
        })
    );

    const allOutput = results.map((r) => r.output).join('');
    const allOk = results.every((r) => r.ok);

    if (allOk) {
        const compiled = results.map((r) => `  → ${r.outFile}`).join('\n');
        return {
            ok: true,
            output: `${allOutput}\n[@tlfx/compiler] Built ${files.length} file(s):\n${compiled}\n`
        };
    }

    return { ok: false, output: allOutput };
}
