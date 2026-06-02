import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export type Platform = 'win32-x64' | 'linux-x64';

/**
 * Resolves the current platform identifier used to locate the correct binary.
 */
export function getCurrentPlatform(): Platform {
    const plat = process.platform;
    const arch = process.arch;

    if (plat === 'win32' && arch === 'x64') return 'win32-x64';
    if (plat === 'linux' && arch === 'x64') return 'linux-x64';

    throw new Error(`Unsupported platform: ${plat}-${arch}. Supported: win32-x64, linux-x64`);
}

/**
 * Returns the expected binary filename for a given platform.
 */
export function getBinaryName(platform: Platform): string {
    return platform === 'win32-x64' ? 'tl.exe' : 'tl';
}

/**
 * Resolves the absolute path to the bundled tl binary.
 * Looks in: <extensionRoot>/bin/<platform>/tl[.exe]
 */
export function resolveBinaryPath(extensionRoot: string): string {
    const platform = getCurrentPlatform();
    const binaryName = getBinaryName(platform);
    const binaryPath = join(extensionRoot, 'bin', platform, binaryName);

    if (!existsSync(binaryPath)) {
        throw new Error(
            `Teal binary not found at: ${binaryPath}\n` + `Expected platform: ${platform}`
        );
    }

    return binaryPath;
}

/**
 * Ensures the binary is executable (no-op on Windows).
 * Call this once on extension activation.
 */
export function ensureExecutable(binaryPath: string): void {
    if (process.platform === 'win32') return;

    try {
        chmodSync(binaryPath, 0o755);
    } catch (err) {
        console.warn(`[@tlfx/vscode] Could not chmod binary: ${err}`);
    }
}

/**
 * Runs `tl --version` and returns the version string, or null on failure.
 */
export function queryBinaryVersion(binaryPath: string): string | null {
    try {
        const result = spawnSync(binaryPath, ['--version'], {
            encoding: 'utf8',
            timeout: 5000
        });

        if (result.status === 0 && result.stdout) {
            return result.stdout.trim();
        }

        return null;
    } catch {
        return null;
    }
}
