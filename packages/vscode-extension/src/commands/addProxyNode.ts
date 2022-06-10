import * as vscode from 'vscode';
import * as configuration from '../configuration/configuration';

export async function addProxyNode(): Promise<void> {
  const result = await vscode.window.showInputBox({
    prompt: 'Enter hostname:port or ip:port (eg. www.qq.com:80 or 10.0.0.1:3000)',
    ignoreFocusOut: true,
    validateInput: (input: string) => {
      const str = input.trim();
      const parts = str.split(':');
      if (parts.length !== 2 || parts.some(x => x.length === 0)) {
        return 'invalid format';
      }
      return null;
    },
  });

  if (result) {
    configuration.addProxyNode(result);
  }
}
