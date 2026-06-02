/**
 * scripts/download-binaries.ts
 *
 * Downloads the tl compiler binaries for all supported platforms into bin/.
 * Run this before packaging the VSIX — binaries are not committed to the repo.
 *
 * Usage:
 *   pnpm tsx scripts/download-binaries.ts
 *
 * Output:
 *   bin/win32-x64/tl.exe
 *   bin/linux-x64/tl
 */

import { execFileSync } from 'node:child_process';
import { chmodSync, createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN_DIR = join(__dirname, '..', 'bin');

const TL_VERSION = '0.24.8';
const RELEASES_BASE = `https://github.com/teal-language/tl/releases/download/v${TL_VERSION}`;

interface PlatformInfo {
    asset: string;
    exe: string;
}

const PLATFORM_MAP: Record<string, PlatformInfo> = {
    'win32-x64': {
        asset: `tl-${TL_VERSION}-windows-x86_64.zip`,
        exe: 'tl.exe'
    },
    'linux-x64': {
        asset: `tl-${TL_VERSION}-linux-x86_64.tar.gz`,
        exe: 'tl'
    }
};

async function downloadPlatform(platformKey: string, info: PlatformInfo): Promise<void> {
    const platformDir = join(BIN_DIR, platformKey);
    const exePath = join(platformDir, info.exe);

    if (existsSync(exePath)) {
        console.log(`  [${platformKey}] Already present, skipping.`);
        return;
    }

    mkdirSync(platformDir, { recursive: true });

    const url = `${RELEASES_BASE}/${info.asset}`;
    console.log(`  [${platformKey}] Downloading ${info.asset}...`);

    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok || !res.body) {
        throw new Error(`  [${platformKey}] Download failed: ${res.status} ${res.statusText}`);
    }

    const archivePath = join(platformDir, info.asset);
    await pipeline(res.body, createWriteStream(archivePath));

    if (info.asset.endsWith('.tar.gz')) {
        execFileSync('tar', ['-xzf', archivePath, '-C', platformDir]);
    } else if (info.asset.endsWith('.zip')) {
        execFileSync('powershell', [
            '-Command',
            `Expand-Archive -Path '${archivePath}' -DestinationPath '${platformDir}' -Force`
        ]);
    }

    const extractedDirName = info.asset.replace(/\.tar\.gz$/, '').replace(/\.zip$/, '');
    const extractedBinaryPath = join(platformDir, extractedDirName, info.exe);

    if (!existsSync(extractedBinaryPath)) {
        throw new Error(
            `  [${platformKey}] Expected binary at ${extractedBinaryPath} after extraction.\n` +
                `  The archive layout may have changed — check the release assets manually.`
        );
    }

    renameSync(extractedBinaryPath, exePath);
    rmSync(join(platformDir, extractedDirName), { recursive: true, force: true });
    rmSync(archivePath);

    if (process.platform !== 'win32') {
        chmodSync(exePath, 0o755);
    }

    console.log(`  [${platformKey}] Ready at ${exePath}`);
}

async function main(): Promise<void> {
    console.log(`Downloading tl v${TL_VERSION} binaries for all platforms...\n`);

    const results = await Promise.allSettled(
        Object.entries(PLATFORM_MAP).map(([platformKey, info]) =>
            downloadPlatform(platformKey, info)
        )
    );

    let failed = false;
    for (const [_i, result] of results.entries()) {
        if (result.status === 'rejected') {
            console.error(`\nFailed: ${result.reason}`);
            failed = true;
        }
    }

    if (failed) {
        process.exit(1);
    }

    console.log('\nAll binaries ready.');
}

main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
});
