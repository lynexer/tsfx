import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitLibrary } from './emit.js';
import { fetchSdkFiles } from './fetch.js';
import { mergeModel } from './merge.js';
import { parseAllFiles } from './parse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LIBRARY_DIR = join(__dirname, '..', 'library');
const OUTPUT_FILE = join(LIBRARY_DIR, 'tsfx.lua');

async function main(): Promise<void> {
    const startTime = Date.now();
    console.log('╔══════════════════════════════════════╗');
    console.log('║   TSFX LuaLS Addon Generator         ║');
    console.log('╚══════════════════════════════════════╝');
    console.log();

    try {
        const files = await fetchSdkFiles();
        const parsed = parseAllFiles(files);
        const model = mergeModel(parsed);
        const output = emitLibrary(model);

        await mkdir(LIBRARY_DIR, { recursive: true });
        await writeFile(OUTPUT_FILE, output, 'utf-8');

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log();
        console.log(`✓ Generated: library/tsfx.lua`);
        console.log(`  Classes:   ${model.classes.size}`);
        console.log(`  Aliases:   ${model.aliases.size}`);
        console.log(`  TSFX fields: ${model.tsfxFields.length}`);
        console.log(`  Lines:     ${output.split('\n').length}`);
        console.log(`  Time:      ${elapsed}s`);
        console.log();
    } catch (err) {
        console.error('\n✗ Generation failed:');
        console.error(err);

        process.exit(1);
    }
}

main();
