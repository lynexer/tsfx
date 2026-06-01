import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { PLATFORM_MAP } from './constants';

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
 * Compiles all .tl files in a project using tlconfig.lua.
 * Equivalent to running `tl build` in the project root.
 */
export async function build(cwd: string = process.cwd()): Promise<CompileResult> {
    const tl = getTlBinary();
    try {
        const { stdout, stderr } = await execFileAsync(tl, ['build'], { cwd });
        return { ok: true, output: stdout + stderr };
    } catch (err: unknown) {
        const e = err as { stdout?: string; stderr?: string };
        return { ok: false, output: (e.stdout ?? '') + (e.stderr ?? '') };
    }
}
