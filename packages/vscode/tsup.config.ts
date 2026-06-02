import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        extension: 'src/extension.ts'
    },
    outDir: 'dist',
    format: ['cjs'],
    target: 'node18',
    platform: 'node',
    sourcemap: true,
    bundle: true,
    minify: false,
    external: ['vscode'],
    dts: false,
    clean: true
});
