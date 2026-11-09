import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import type { DownloadProgress } from '../types';

export async function download(
    url: string,
    outDir: string,
    onProgress?: (progress: DownloadProgress) => void
): Promise<string> {
    const fileName = path.basename(new URL(url).pathname);
    const filePath = path.join(outDir, fileName);

    await downloadFile(url, filePath, onProgress);

    return filePath;
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
