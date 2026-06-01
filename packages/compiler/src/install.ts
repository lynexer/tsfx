import { execFileSync } from 'node:child_process';
import { chmodSync, createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import fetch from 'node-fetch';
import { PLATFORM_MAP, RELEASES_BASE, TL_VERSION } from './constants';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN_DIR = join(__dirname, '..', 'bin');

async function install(): Promise<void> {
    const platformKey = `${process.platform}-${process.arch}`;
    const platformInfo = PLATFORM_MAP[platformKey];

    if (!platformInfo) {
        console.warn(
            `[@tlfx/compiler] No pre-built binary available for ${platformKey}.\n` +
                `  Set TL_BINARY=/path/to/tl in your environment to use your own.`
        );

        return;
    }

    const exePath = join(BIN_DIR, platformInfo.exe);

    if (existsSync(exePath)) {
        console.log('[@tlfx/compiler] Binary already present, skipping download.');
        return;
    }

    mkdirSync(BIN_DIR, { recursive: true });

    const url = `${RELEASES_BASE}/${platformInfo.asset}`;
    console.log(`[@tlfx/compiler] Downloading tl v${TL_VERSION} for ${platformKey}...`);

    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok || !res.body) {
        throw new Error(`Download Failed: ${res.status} ${res.statusText}`);
    }

    const archivePath = join(BIN_DIR, platformInfo.asset);
    await pipeline(res.body, createWriteStream(archivePath));

    if (platformInfo.asset.endsWith('.tar.gz')) {
        execFileSync('tar', ['-xzf', archivePath, '-C', BIN_DIR]);
    } else if (platformInfo.asset.endsWith('.zip')) {
        execFileSync('powershell', [
            '-Command',
            `Expand-Archive -Path '${archivePath}' -DestinationPath '${BIN_DIR}' -Force`
        ]);
    }

    if (process.platform !== 'win32') {
        chmodSync(exePath, 0o755);
    }

    console.log(`[teal-cfx] tl binary ready at ${exePath}`);
}

install().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[@tlfx/compiler] Binary install failed: ${message}`);
    console.warn(`[@tlfx/compiler] Set TL_BINARY=/path/to/tl to use your own.`);
});
