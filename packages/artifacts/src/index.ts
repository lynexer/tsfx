#!/usr/bin/env node

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { Listr } from 'listr2';
import { gray, green, yellow } from 'yoctocolors';
import { download } from './services/downloader';
import { extract } from './services/extractor';
import { resolve } from './services/resolver';
import { Config } from './utils/config';
import { formatBytes } from './utils/format';

interface Ctx {
    filePath?: string;
}

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
                    const source = await resolve(config.platform, config.branch, config.os);
                    task.title = `Downloading Artifact (${source.version})`;

                    ctx.filePath = await download(
                        source.url,
                        config.outDir,
                        ({ downloaded, total, percent }) => {
                            const size = total
                                ? `${formatBytes(downloaded)} / ${formatBytes(total)}`
                                : formatBytes(downloaded);
                            const progress = percent ? ` (${Math.round(percent * 100)}%)` : '';
                            task.output = `${size}${progress}`;
                        }
                    );
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
