#!/usr/bin/env node
import { resolve } from 'node:path';
import { build, check, compile, getTlBinary } from './index.js';

const [, , command, ...args] = process.argv;

function printUsage(): void {
    console.error('Usage: teal-cfx <check|compile|build|which> [args]');
    console.error('  check   <file.tl>                  Type-check a file');
    console.error('  compile <file.tl> [--out-dir <d>]  Compile to .lua');
    console.error('  build   [project-root]             Run tl build via tlconfig.lua');
    console.error('  which                              Print path to tl binary');
}

async function main(): Promise<void> {
    switch (command) {
        case 'check': {
            if (!args[0]) {
                printUsage();
                process.exit(1);
            }
            const result = await check(resolve(args[0]));
            process.stdout.write(result.output);
            process.exit(result.ok ? 0 : 1);
            break;
        }

        case 'compile': {
            if (!args[0]) {
                printUsage();
                process.exit(1);
            }
            const outDirIdx = args.indexOf('--out-dir');
            const outDir = outDirIdx !== -1 ? resolve(args[outDirIdx + 1]) : undefined;
            const result = await compile(resolve(args[0]), { outDir });
            process.stdout.write(result.output);
            if (result.ok && result.outFile) console.log(`→ ${result.outFile}`);
            process.exit(result.ok ? 0 : 1);
            break;
        }

        case 'build': {
            const cwd = args[0] ? resolve(args[0]) : process.cwd();
            const result = await build(cwd);
            process.stdout.write(result.output);
            process.exit(result.ok ? 0 : 1);
            break;
        }

        case 'which': {
            try {
                console.log(getTlBinary());
            } catch (e: unknown) {
                console.error(e instanceof Error ? e.message : String(e));
                process.exit(1);
            }
            break;
        }

        default:
            printUsage();
            process.exit(1);
    }
}

main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
});
