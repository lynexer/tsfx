import path from 'node:path';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { red } from 'yoctocolors';

export type BranchOption = 'recommended' | 'stable' | 'latest';
export type OsOption = 'win32' | 'linux';

export class Config {
    public options: {
        output?: string;
        version?: string;
        branch?: string;
        help?: string;
        _unknown?: string[];
    };

    public outDir: string;
    public branch: BranchOption;
    public os: OsOption;
    public fileName: string;
    public artifactPath: string;

    private definitions = [
        {
            name: 'output',
            alias: 'o',
            type: String,
            description: 'Output directory (default: fxserver)'
        },
        {
            name: 'branch',
            alias: 'b',
            type: String,
            description: 'Artifact branch (recommended, stable, latest)'
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
        this.branch = this.validateBranchOptions();
        this.outDir = path.resolve(this.options.output || 'fxserver');
        this.fileName = this.os === 'win32' ? 'server.7z' : 'fx.tar.xz';
        this.artifactPath = path.join(this.outDir, this.fileName);
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

    private validateBranchOptions(): BranchOption {
        const options = ['recommended', 'stable', 'latest'];

        if (!this.options.branch) return 'recommended';

        if (this.options.branch && options.includes(this.options.branch)) {
            return this.options.branch as BranchOption;
        } else {
            console.error(red(`Unknown branch: '${this.options.branch}'. Using 'recommended'.`));
        }

        return 'recommended';
    }
}
