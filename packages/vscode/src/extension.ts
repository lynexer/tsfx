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
import {
    ensureExecutable,
    queryBinaryVersion,
    resolveBinaryPath,
    resolveLspPath
} from './binaryResolver';
import { runCheck } from './diagnostics';
import { isLspRunning, startLspClient, stopLspClient } from './lspClient';
import { getFiveMGlobalEnvDef, getFiveMTypesDir } from './typePathManager';

let diagnosticCollection: DiagnosticCollection;
let outputChannel: OutputChannel;
let binaryPath: string;

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 500;

export function activate(context: ExtensionContext): void {
    outputChannel = window.createOutputChannel('Teal for FiveM');
    context.subscriptions.push(outputChannel);

    diagnosticCollection = languages.createDiagnosticCollection('teal');
    context.subscriptions.push(diagnosticCollection);

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

    const config = workspace.getConfiguration('teal-fivem');
    const injectFiveMTypes = config.get<boolean>('injectFiveMTypes', true);
    const globalEnvDef = injectFiveMTypes ? getFiveMGlobalEnvDef(context.extensionPath) : null;

    if (injectFiveMTypes && !globalEnvDef) {
        outputChannel.appendLine(
            "[@tlfx/vscode] WARNING: fivem.d.tl not found — run 'pnpm gen-natives' to generate FiveM type definitions."
        );
    }

    const lspPath = resolveLspPath(context.extensionPath);

    if (lspPath) {
        outputChannel.appendLine('[@tlfx/vscode] Windows detected — starting LSP.');
        startLspClient(context, lspPath, outputChannel);
    } else {
        outputChannel.appendLine(
            '[@tlfx/vscode] Linux detected — LSP not available. Using on-save diagnostics.'
        );
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

    context.subscriptions.push(
        workspace.onDidChangeTextDocument((event) => {
            if (isLspRunning()) return;

            const doc = event.document;
            if (doc.languageId !== 'teal') return;

            const cfg = workspace.getConfiguration('teal-fivem');
            if (!cfg.get<boolean>('checkOnType', true)) return;

            const key = doc.uri.toString();
            const existing = debounceTimers.get(key);
            if (existing) clearTimeout(existing);

            debounceTimers.set(
                key,
                setTimeout(() => {
                    debounceTimers.delete(key);
                    if (!doc.isDirty) {
                        checkDocument(doc, context.extensionPath);
                    }
                }, DEBOUNCE_MS)
            );
        })
    );

    // --- Save hook ---
    context.subscriptions.push(
        workspace.onDidSaveTextDocument((doc) => {
            if (doc.languageId !== 'teal') return;

            const key = doc.uri.toString();
            const existing = debounceTimers.get(key);

            if (existing) {
                clearTimeout(existing);
                debounceTimers.delete(key);
            }

            const cfg = workspace.getConfiguration('teal-fivem');

            if (cfg.get<boolean>('checkOnSave', true)) {
                checkDocument(doc, context.extensionPath);
            }
        })
    );

    // --- Open hook ---
    context.subscriptions.push(
        workspace.onDidOpenTextDocument((doc) => {
            if (doc.languageId === 'teal') {
                checkDocument(doc, context.extensionPath);
            }
        })
    );

    // --- Close hook ---
    context.subscriptions.push(
        workspace.onDidCloseTextDocument((doc) => {
            const key = doc.uri.toString();
            const existing = debounceTimers.get(key);

            if (existing) {
                clearTimeout(existing);
                debounceTimers.delete(key);
            }

            diagnosticCollection.delete(doc.uri);
        })
    );

    for (const doc of workspace.textDocuments) {
        if (doc.languageId === 'teal') {
            checkDocument(doc, context.extensionPath);
        }
    }
}

export async function deactivate(): Promise<void> {
    await stopLspClient();
    for (const timer of debounceTimers.values()) clearTimeout(timer);

    debounceTimers.clear();
    diagnosticCollection?.clear();
    diagnosticCollection?.dispose();
    outputChannel?.dispose();
}

// ---------------------------------------------------------------------------

async function checkDocument(doc: TextDocument, extensionPath: string): Promise<void> {
    const config = workspace.getConfiguration('teal-fivem');
    const injectFiveMTypes = config.get<boolean>('injectFiveMTypes', true);
    const workspaceRoot = workspace.getWorkspaceFolder(doc.uri)?.uri.fsPath;
    const fivemTypesDir = injectFiveMTypes ? getFiveMTypesDir(extensionPath) : null;
    const globalEnvDef = injectFiveMTypes ? getFiveMGlobalEnvDef(extensionPath) : null;

    outputChannel.appendLine(`[@tlfx/vscode] Checking: ${doc.uri.fsPath}`);

    const resultMap = await runCheck({
        binaryPath,
        filePath: doc.uri.fsPath,
        fileText: doc.getText(),
        workspaceRoot,
        fivemTypesDir,
        globalEnvDef,
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
