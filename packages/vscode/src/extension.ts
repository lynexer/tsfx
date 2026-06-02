import {
    commands,
    type DiagnosticCollection,
    type ExtensionContext,
    languages,
    type OutputChannel,
    type TextDocument,
    Uri,
    window,
    workspace
} from 'vscode';
import { ensureExecutable, queryBinaryVersion, resolveBinaryPath } from './binaryResolver';
import { runCheck } from './diagnostics';
import { resolveIncludeDirs, resolveTlConfig } from './typePathManager';

let diagnosticCollection: DiagnosticCollection;
let outputChannel: OutputChannel;
let binaryPath: string;

export function activate(context: ExtensionContext): void {
    outputChannel = window.createOutputChannel('Teal for FiveM');
    context.subscriptions.push(outputChannel);

    diagnosticCollection = languages.createDiagnosticCollection('teal');
    context.subscriptions.push(diagnosticCollection);

    // --- Resolve binary ---
    try {
        binaryPath = resolveBinaryPath(context.extensionPath);
        ensureExecutable(binaryPath);
        outputChannel.appendLine(`[@tlfx/vscode] Activated. Binary: ${binaryPath}`);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);

        outputChannel.appendLine(`[@tlfx/vscode] ERROR: ${msg}`);
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
}

export function deactivate(): void {
    diagnosticCollection?.clear();
    diagnosticCollection?.dispose();
    outputChannel?.dispose();
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

    outputChannel.appendLine(`[@tlfx/vscode] Checking: ${doc.uri.fsPath}`);

    const resultMap = await runCheck({
        binaryPath,
        filePath: doc.uri.fsPath,
        workspaceRoot,
        includeDirs,
        tlConfigPath,
        outputChannel
    });

    diagnosticCollection.delete(doc.uri);

    let diagCount = 0;
    for (const [uriStr, diags] of resultMap) {
        diagnosticCollection.set(Uri.parse(uriStr), diags);
        diagCount += diags.length;
    }

    outputChannel.appendLine(`[@tlfx/vscode] Done. ${diagCount} diagnostic(s) found.`);
}
