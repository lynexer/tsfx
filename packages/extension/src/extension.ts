import { join } from 'node:path';
import { type ExtensionContext, workspace } from 'vscode';

const EXTENSION_ID = 'lynexer.tsfx-vscode';

function getLuaConfig() {
    return workspace.getConfiguration('Lua');
}

function getSettingsScope() {
    return workspace.workspaceFile ? 2 : 1;
}

function getLibraryPath(context: ExtensionContext): string {
    return join(context.extensionPath, 'node_modules', '@tsfx', 'types', 'library');
}

async function setLibrary(libraryPath: string, enable: boolean) {
    const config = getLuaConfig();
    const library: string[] = config.get('workspace.library') ?? [];

    for (let i = library.length - 1; i >= 0; i--) {
        if (library[i].includes(EXTENSION_ID)) {
            library.splice(i, 1);
        }
    }

    if (enable) {
        library.push(libraryPath);
    }

    await config.update('workspace.library', library, getSettingsScope());
}

export async function activate(context: ExtensionContext) {
    await setLibrary(getLibraryPath(context), true);
}

export async function deactivate(context: ExtensionContext) {
    await setLibrary(getLibraryPath(context), false);
}
