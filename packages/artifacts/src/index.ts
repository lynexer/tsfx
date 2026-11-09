#!/usr/bin/env node

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { Listr } from 'listr2';
import { gray, green, yellow } from 'yoctocolors';
import { download } from './services/Downloader';
import { extract } from './services/Extractor';
import { Config } from './utils/Config';

interface Ctx {
    filePath?: string;
}

const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    const digits = unitIndex === 0 ? 0 : 1;

    return `${value.toFixed(digits)} ${units[unitIndex]}`;
};

const main = async (): Promise<void> => {
    const config = new Config();

    if (config.options.help) {
        config.printHelp();
        return;
    }

    if (existsSync(config.outDir)) {
        rmSync(config.outDir, { recursive: true, force: true });
    }

    mkdirSync(config.outDir, { recursive: true });

    console.log(yellow(`\n${gray('<TSFX>')} Updating FiveM Artifact >>`));

    const tasks = new Listr<Ctx>(
        [
            {
                title: 'Downloading Artifact',
                task: async (ctx, task) => {
                    const result = await download(
                        config.platform,
                        config.branch,
                        config.os,
                        config.outDir,
                        ({ downloaded, total, percent }) => {
                            const size = total
                                ? `${formatBytes(downloaded)} / ${formatBytes(total)}`
                                : formatBytes(downloaded);
                            const progress = percent ? ` (${Math.round(percent * 100)}%)` : '';
                            task.output = `${size}${progress}`;
                        }
                    );

                    ctx.filePath = result.filePath;
                    task.title = `Downloading Artifact (${result.version})`;
                }
            },
            {
                title: 'Extracting Artifact',
                task: async (ctx) => {
                    if (!ctx.filePath) {
                        throw new Error('Download did not produce a file path');
                    }

                    await extract(ctx.filePath, config.outDir);
                }
            }
        ],
        { concurrent: false, exitOnError: false }
    );

    await tasks.run();

    console.log(green('\nSuccessfully updated FiveM Artifact!'));
    console.log(gray(`Extracted to: ${config.outDir}\n`));
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
