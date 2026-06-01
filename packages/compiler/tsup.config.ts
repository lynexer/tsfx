import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        cli: 'src/cli.ts',
        install: 'src/install.ts'
    },
    format: ['esm'],
    target: 'node18',
    outDir: 'dist',
    dts: {
        entry: 'src/index.ts'
    },
    splitting: false,
    clean: true,
    banner: {
        js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`
    }
});
