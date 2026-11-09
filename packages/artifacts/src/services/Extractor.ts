import { execFile } from 'node:child_process';
import { rmSync } from 'node:fs';
import { promisify } from 'node:util';
import zip from '7zip-min';

const execFileAsync = promisify(execFile);

export async function extract(filePath: string, outDir: string): Promise<void> {
    if (filePath.endsWith('.zip') || filePath.endsWith('.7z')) {
        await zip.unpack(filePath, outDir);
    } else if (filePath.endsWith('.tar.xz')) {
        await execFileAsync('tar', ['xf', filePath, '-C', outDir]);
    } else {
        throw new Error(`Unsupported archive format: ${filePath}`);
    }

    rmSync(filePath, { force: true });
}
