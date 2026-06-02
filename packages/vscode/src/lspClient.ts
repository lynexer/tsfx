import * as vscode from 'vscode';
import {
    type Executable,
    LanguageClient,
    type LanguageClientOptions,
    type ServerOptions,
    State
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;
let lspReady = false;

export function startLspClient(
    context: vscode.ExtensionContext,
    lspBatPath: string,
    outputChannel: vscode.OutputChannel
): void {
    outputChannel.appendLine(`[teal-fivem] LSP binary: ${lspBatPath}`);

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    outputChannel.appendLine(`[teal-fivem] LSP workspace root: ${workspaceRoot ?? '(none)'}`);

    const executable: Executable = {
        command: 'cmd.exe',
        args: ['/c', lspBatPath, '--log-mode', 'by_date'],
        options: {
            cwd: workspaceRoot,
            env: process.env
        }
    };

    const serverOptions: ServerOptions = {
        run: executable,
        debug: executable
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'teal' }],
        outputChannel,
        traceOutputChannel: outputChannel,
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/tlconfig.lua')
        },
        // teal-language-server passes rootUri directly to lfs.attributes() without
        // URI decoding, so %3A in Windows drive letters (c%3A -> c:) makes it crash.
        // code2Protocol runs on every URI before it's sent to the server, so we
        // decode it here to produce file:///c:/Users/... instead of file:///c%3A/...
        uriConverters: {
            code2Protocol: (uri: vscode.Uri) => decodeURIComponent(uri.toString()),
            protocol2Code: (value: string) => vscode.Uri.parse(value)
        }
    };

    client = new LanguageClient(
        'teal-fivem-lsp',
        'Teal for FiveM (LSP)',
        serverOptions,
        clientOptions
    );

    client.onDidChangeState((event) => {
        outputChannel.appendLine(
            `[teal-fivem] LSP state: ${State[event.oldState]} -> ${State[event.newState]}`
        );
        if (event.newState === State.Running) {
            lspReady = true;
            outputChannel.appendLine('[teal-fivem] LSP ready.');
        } else if (event.newState === State.Stopped) {
            lspReady = false;
        }
    });

    outputChannel.appendLine('[teal-fivem] Starting LSP client...');
    client
        .start()
        .then(() => {
            outputChannel.appendLine('[teal-fivem] LSP client.start() resolved.');
        })
        .catch((err: unknown) => {
            lspReady = false;
            const msg = err instanceof Error ? err.message : String(err);
            outputChannel.appendLine(`[teal-fivem] LSP start error: ${msg}`);
            vscode.window.showWarningMessage(
                `Teal for FiveM: LSP failed to start. Check output panel for details.`
            );
        });

    context.subscriptions.push(client);
}

export async function stopLspClient(): Promise<void> {
    if (client) {
        await client.stop();
        client = undefined;
        lspReady = false;
    }
}

export function isLspRunning(): boolean {
    return lspReady;
}
