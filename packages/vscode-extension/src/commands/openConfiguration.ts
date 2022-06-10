import * as vscode from 'vscode';

export async function openConfiguration(): Promise<void> {
  vscode.commands.executeCommand('workbench.action.openSettings', 'wxcloud');
}
