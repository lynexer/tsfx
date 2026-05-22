import { copyFileSync, mkdirSync } from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/index.ts',
        'src/components/ui/*.tsx',
        'src/components/app/*.tsx',
        'src/themes/index.ts',
        'src/providers/theme-provider.tsx',
        'src/hooks/use-theme.ts'
    ],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: ['react', 'react-dom', 'tailwindcss'],
    esbuildOptions(options) {
        options.jsx = 'automatic';
    },
    async onSuccess() {
        mkdirSync('dist/styles', { recursive: true });
        copyFileSync('src/styles/globals.css', 'dist/styles/globals.css');
        console.log('✓ Copied globals.css to dist/styles/');
    }
});
