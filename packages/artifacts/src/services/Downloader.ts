import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import type { BranchOption, OsOption, PlatformOption } from '../utils/Config';

interface JGResponse {
    recommendedArtifact: string;
    windowsDownloadLink: string;
    linuxDownloadLink: string;
}

interface ChangelogResponse {
    latest: string;
    recommended: string;
    latest_download: string;
    recommended_download: string;
}

interface EnhancedArtifact {
    displayName: string;
    subtitle: string;
    downloadURL: string;
}

interface EnhancedPageProps {
    enhanced: {
        linux: EnhancedArtifact[];
        windows: EnhancedArtifact[];
    };
}

interface ResolvedArtifact {
    url: string;
    version: string;
}

export interface DownloadProgress {
    downloaded: number;
    total: number | null;
    percent: number | null;
}

export interface DownloadResult {
    filePath: string;
    version: string;
}

export async function download(
    platform: PlatformOption,
    branch: BranchOption,
    os: OsOption,
    outDir: string,
    onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {
    const { url, version } = await resolve(platform, branch, os);

    const fileName = path.basename(new URL(url).pathname);
    const filePath = path.join(outDir, fileName);

    await downloadFile(url, filePath, onProgress);

    return { filePath, version };
}

async function resolve(
    platform: PlatformOption,
    branch: BranchOption,
    os: OsOption
): Promise<ResolvedArtifact> {
    if (platform === 'enhanced') {
        return resolveEnhanced(os);
    }

    if (branch === 'recommended') {
        const response = await fetch('https://artifacts.jgscripts.com/jsonv2');

        if (!response.ok) {
            throw new Error(`Failed to fetch recommended artifact: ${response.statusText}`);
        }

        const data = (await response.json()) as JGResponse;

        return {
            version: data.recommendedArtifact,
            url: os === 'win32' ? data.windowsDownloadLink : data.linuxDownloadLink
        };
    }

    const response = await fetch(
        `https://changelogs-live.fivem.net/api/changelog/versions/${os}/server`
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch latest changelog for ${os}: ${response.statusText}`);
    }

    const data = (await response.json()) as ChangelogResponse;

    return {
        version: data.latest,
        url: data.latest_download
    };
}

async function resolveEnhanced(os: OsOption): Promise<ResolvedArtifact> {
    const response = await fetch('https://docs.fivem.net/docs/server-download/');

    if (!response.ok) {
        throw new Error(`Failed to fetch enhanced artifact: ${response.statusText}`);
    }

    const html = await response.text();
    const match = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s
    );

    if (!match) {
        throw new Error('Failed to parse enhanced artifact data from docs.fivem.net');
    }

    const data = JSON.parse(match[1]) as {
        props: { pageProps: EnhancedPageProps };
    };

    const osKey = os === 'win32' ? 'windows' : 'linux';
    const artifact = data.props.pageProps.enhanced[osKey][0];

    if (!artifact) {
        throw new Error(`No enhanced artifact found for ${os}`);
    }

    return {
        url: artifact.downloadURL,
        version: artifact.subtitle
    };
}

async function downloadFile(
    url: string,
    filePath: string,
    onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
    const response = await fetch(url);

    if (!response.ok || !response.body) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const total = Number(response.headers.get('content-length')) || null;
    const readStream = Readable.fromWeb(response.body as unknown as WebReadableStream);

    let downloaded = 0;
    readStream.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        onProgress?.({
            downloaded,
            total,
            percent: total ? downloaded / total : null
        });
    });

    await pipeline(readStream, createWriteStream(filePath));
}
