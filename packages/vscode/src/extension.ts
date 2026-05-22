import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('tsfx.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from TSFX!');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
