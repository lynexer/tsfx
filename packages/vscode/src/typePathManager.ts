import { existsSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

/**
 * Returns the absolute path to the bundled FiveM type definitions directory.
 */
export function getFiveMTypesDir(extensionRoot: string): string {
    return join(extensionRoot, 'types', 'fivem');
}

/**
 * Returns the single --global-env-def module name for the merged FiveM
 * type definition file (fivem.d.tl). Returns null if the file doesn't exist
 * yet (i.e. gen-natives hasn't been run).
 */
export function getFiveMGlobalEnvDef(extensionRoot: string): string | null {
    const fivemDtl = join(extensionRoot, 'types', 'fivem', 'fivem.d.tl');
    return existsSync(fivemDtl) ? 'fivem' : null;
}

/**
 * Returns all include directories that should be passed to `tl check`.
 * Merges the bundled FiveM types dir with any user-configured extra dirs.
 */
export function resolveIncludeDirs(
    extensionRoot: string,
    injectFiveMTypes: boolean,
    extraDirs: string[]
): string[] {
    const dirs: string[] = [];

    if (injectFiveMTypes) {
        const fivemDir = getFiveMTypesDir(extensionRoot);
        if (existsSync(fivemDir)) {
            dirs.push(fivemDir);
        } else {
            console.warn(`[@tlfx/vscode] FiveM types directory not found at: ${fivemDir}`);
        }
    }

    for (const dir of extraDirs) {
        if (existsSync(dir)) {
            dirs.push(dir);
        } else {
            console.warn(`[@tlfx/vscode] Extra include dir not found, skipping: ${dir}`);
        }
    }

    return dirs;
}

/**
 * Resolves the tlconfig.lua path from settings or falls back to workspace root.
 */
export function resolveTlConfig(
    configuredPath: string,
    workspaceRoot: string | undefined
): string | undefined {
    if (configuredPath) {
        return isAbsolute(configuredPath)
            ? configuredPath
            : workspaceRoot
              ? join(workspaceRoot, configuredPath)
              : undefined;
    }

    if (workspaceRoot) {
        const defaultPath = join(workspaceRoot, 'tlconfig.lua');
        return existsSync(defaultPath) ? defaultPath : undefined;
    }

    return undefined;
}
