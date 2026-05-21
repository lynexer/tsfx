#!/usr/bin/env node

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import Listr, { type ListrTaskObject } from 'listr';
import { gray, green, yellow } from 'yoctocolors';
import type Observable from 'zen-observable';
import { Downloader } from './services/Downloader';
import { Extractor } from './services/Extractor';
import { Config } from './utils/Config';

(() => {
    const config = new Config();

    if (config.options.help) {
        config.printHelp();
        process.exit(0);
    }

    if (existsSync(config.outDir)) {
        rmSync(config.outDir, { recursive: true, force: true });
    }

    mkdirSync(config.outDir, { recursive: true });

    const tasks = new Listr([
        {
            title: 'Downloading Artifact',
            task: () => Downloader.download(config.os, config.branch, config.artifactPath)
        } as unknown as ListrTaskObject<Observable<string>>,
        {
            title: 'Extracting Artifact',
            task: () => Extractor.extract(config.artifactPath, config.outDir)
        }
    ]);

    console.log(yellow(`\n${gray('<TSFX>')} Updating FiveM Artifact >>`));

    tasks
        .run()
        .then(() => {
            console.log(green('\nSuccessfully updated FiveM Artifact!'));
            console.log(gray(`Extracted to: ${config.outDir}\n`));
        })
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
})();
