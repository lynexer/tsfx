/**
 * scripts/download-lsp.ts
 *
 * Downloads the teal-language-server Windows binary from the latest GitHub release.
 * The zip extracts as tls-windows/ which we keep intact since lua.exe needs
 * lua54.dll to be in the same directory and the .bat uses relative paths to lib/.
 *
 * Usage:
 *   pnpm run download-lsp
 *
 * Output:
 *   bin/lsp/win32-x64/tls-windows/bin/teal-language-server.bat
 *   bin/lsp/win32-x64/tls-windows/bin/lua.exe
 *   bin/lsp/win32-x64/tls-windows/bin/lua54.dll
 *   bin/lsp/win32-x64/tls-windows/lib/...
 *   bin/lsp/win32-x64/tls-windows/share/...
 */

import { execFileSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LSP_DIR = join(ROOT, 'bin', 'lsp', 'win32-x64');
const MARKER = join(LSP_DIR, 'bin', 'teal-language-server.bat');

const RELEASES_API =
    'https://api.github.com/repos/teal-language/teal-language-server/releases/latest';

interface GithubAsset {
    name: string;
    browser_download_url: string;
}

interface GithubRelease {
    tag_name: string;
    assets: GithubAsset[];
}

async function fetchLatestRelease(): Promise<GithubRelease> {
    const res = await fetch(RELEASES_API, {
        headers: { Accept: 'application/vnd.github+json' }
    });

    if (!res.ok) {
        throw new Error(
            `GitHub API returned ${res.status} ${res.statusText}.\n` + `URL: ${RELEASES_API}`
        );
    }

    return res.json() as Promise<GithubRelease>;
}

async function main(): Promise<void> {
    if (existsSync(MARKER)) {
        console.log('teal-language-server already present, skipping download.');
        return;
    }

    console.log('Fetching latest teal-language-server release info...');
    const release = await fetchLatestRelease();
    console.log(`  Latest release: ${release.tag_name}`);

    const asset = release.assets.find((a) => a.name === 'tls-windows.zip');
    if (!asset) {
        throw new Error(
            `Could not find tls-windows.zip in release ${release.tag_name}.\n` +
                `Available assets: ${release.assets.map((a) => a.name).join(', ')}`
        );
    }

    mkdirSync(LSP_DIR, { recursive: true });

    const zipPath = join(LSP_DIR, 'tls-windows.zip');
    console.log(`  Downloading ${asset.name}...`);

    const res = await fetch(asset.browser_download_url, { redirect: 'follow' });
    if (!res.ok || !res.body) {
        throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    }

    await pipeline(res.body, createWriteStream(zipPath));

    console.log('  Extracting...');
    execFileSync('powershell', [
        '-Command',
        `Expand-Archive -Path '${zipPath}' -DestinationPath '${LSP_DIR}' -Force`
    ]);

    rmSync(zipPath);

    if (!existsSync(MARKER)) {
        throw new Error(
            `Extraction succeeded but expected file not found: ${MARKER}\n` +
                `The zip layout may have changed.`
        );
    }

    console.log(`  teal-language-server ready at ${MARKER}`);
}

main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
});
