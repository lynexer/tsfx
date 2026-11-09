import path from 'node:path';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { red } from 'yoctocolors';
import type { BranchOption, CLIOptions, OsOption, PlatformOption } from '../types';

export class Config {
    public options: CLIOptions;

    public outDir: string;
    public branch: BranchOption;
    public platform: PlatformOption;
    public os: OsOption;

    private definitions = [
        {
            name: 'output',
            alias: 'o',
            type: String,
            description: 'Output directory (default: fxserver)'
        },
        {
            name: 'platform',
            alias: 'p',
            type: String,
            description: 'Artifact platform (legacy, enhanced) [default: legacy]'
        },
        {
            name: 'branch',
            alias: 'b',
            type: String,
            description: 'Artifact branch (recommended, latest) [default: recommended]'
        },
        {
            name: 'help',
            alias: 'h',
            type: Boolean,
            description: 'Show help'
        }
    ];

    constructor() {
        this.options = commandLineArgs(this.definitions, { partial: true });

        if (this.options._unknown && this.options._unknown.length > 0) {
            console.error(red(`Unknown option(s): ${this.options._unknown.join(', ')}`));
            this.printHelp();
            process.exit(1);
        }

        this.os = process.platform === 'win32' ? 'win32' : 'linux';
        this.platform = this.validatePlatformOption();
        this.branch = this.validateBranchOption();
        this.outDir = path.resolve(this.options.output || 'fxserver');
    }

    public printHelp(): void {
        const usage = commandLineUsage([
            {
                header: '@tsfx/artifacts',
                content: 'Downloads and extracts FiveM server artifacts.'
            },
            {
                header: 'Options',
                optionList: this.definitions
            }
        ]);

        console.log(usage);
    }

    private validateBranchOption(): BranchOption {
        const options = ['recommended', 'latest'];

        if (!this.options.branch) return 'recommended';

        if (options.includes(this.options.branch)) {
            return this.options.branch as BranchOption;
        }

        console.error(red(`Unknown branch: '${this.options.branch}'. Using 'recommended'.`));

        return 'recommended';
    }

    private validatePlatformOption(): PlatformOption {
        const options = ['legacy', 'enhanced'];

        if (!this.options.platform) return 'legacy';

        if (options.includes(this.options.platform)) {
            return this.options.platform as PlatformOption;
        }

        console.error(red(`Unknown platform: '${this.options.platform}'. Using 'legacy'.`));

        return 'legacy';
    }
}
