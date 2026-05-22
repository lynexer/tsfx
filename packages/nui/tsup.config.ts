import { cpSync } from 'node:fs';
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
    async onSuccess() {
        cpSync('src/styles', 'dist/styles', { recursive: true });
        console.log('✓ Copied src/styles to dist/styles/');
    }
});
