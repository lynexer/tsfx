import {
    commands,
    type DiagnosticCollection,
    type ExtensionContext,
    languages,
    type TextDocument,
    Uri,
    window,
    workspace
} from 'vscode';
import { ensureExecutable, queryBinaryVersion, resolveBinaryPath } from './binaryResolver';
import { runCheck } from './diagnostics';
import { resolveIncludeDirs, resolveTlConfig } from './typePathManager';

let diagnosticCollection: DiagnosticCollection;
let binaryPath: string;

export function activate(context: ExtensionContext): void {
    diagnosticCollection = languages.createDiagnosticCollection('teal');
    context.subscriptions.push(diagnosticCollection);

    // --- Resolve binary ---
    try {
        binaryPath = resolveBinaryPath(context.extensionPath);
        ensureExecutable(binaryPath);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        window.showErrorMessage(`[Teal for FiveM] ${msg}`);
        return;
    }

    // --- Commands ---
    context.subscriptions.push(
        commands.registerCommand('teal-fivem.checkFile', () => {
            const editor = window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'teal') {
                window.showWarningMessage('Open a .tl file to check.');
                return;
            }
            checkDocument(editor.document, context.extensionPath);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('teal-fivem.showVersion', async () => {
            const version = queryBinaryVersion(binaryPath);
            if (version) {
                window.showInformationMessage(`Teal compiler: ${version}`);
            } else {
                window.showErrorMessage('Could not determine Teal compiler version.');
            }
        })
    );

    // --- Save hook ---
    context.subscriptions.push(
        workspace.onDidSaveTextDocument((doc) => {
            if (doc.languageId !== 'teal') return;

            const config = workspace.getConfiguration('teal-fivem');
            const checkOnSave = config.get<boolean>('checkOnSave', true);
            if (checkOnSave) {
                checkDocument(doc, context.extensionPath);
            }
        })
    );

    // --- Open hook: check already-open teal files ---
    context.subscriptions.push(
        workspace.onDidOpenTextDocument((doc) => {
            if (doc.languageId === 'teal') {
                checkDocument(doc, context.extensionPath);
            }
        })
    );

    // Check any .tl files already open when the extension activates
    for (const doc of workspace.textDocuments) {
        if (doc.languageId === 'teal') {
            checkDocument(doc, context.extensionPath);
        }
    }

    console.log('[teal-fivem] Activated. Binary:', binaryPath);
}

export function deactivate(): void {
    diagnosticCollection?.clear();
    diagnosticCollection?.dispose();
}

// ---------------------------------------------------------------------------

async function checkDocument(doc: TextDocument, extensionPath: string): Promise<void> {
    const config = workspace.getConfiguration('teal-fivem');
    const injectFiveMTypes = config.get<boolean>('injectFiveMTypes', true);
    const extraDirs = config.get<string[]>('extraIncludeDirs', []);
    const tlConfigSetting = config.get<string>('tlConfigPath', '');

    const workspaceRoot = workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath;

    const includeDirs = resolveIncludeDirs(extensionPath, injectFiveMTypes, extraDirs);

    const tlConfigPath = resolveTlConfig(tlConfigSetting, workspaceRoot);

    const resultMap = await runCheck({
        binaryPath,
        filePath: doc.uri.fsPath,
        workspaceRoot,
        includeDirs,
        tlConfigPath
    });

    diagnosticCollection.delete(doc.uri);

    for (const [uriStr, diags] of resultMap) {
        diagnosticCollection.set(Uri.parse(uriStr), diags);
    }
}
