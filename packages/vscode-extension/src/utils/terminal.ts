import { cloudbase } from '../core/cloudbase';
import * as vscode from 'vscode';

interface IRunDockerCommandOptions {
  command: string
  name: string
  cwd?: string
  rejectOnExitCode?: boolean
}

export async function runDockerCommand(options: IRunDockerCommandOptions): Promise<void> {
  const { command, name, cwd, rejectOnExitCode } = options;

  const task = new vscode.Task(
    { type: 'shell' },
    vscode.TaskScope.Workspace,
    name,
    'Docker',
    new vscode.ShellExecution(command, {
      cwd: cwd || cloudbase.targetWorkspace.uri.fsPath,
    }),
    [],
  );

  const taskExecution = await vscode.tasks.executeTask(task);

  return new Promise<void>((resolve, reject) => {
    const disposable = vscode.tasks.onDidEndTaskProcess((e) => {
      if (e.execution === taskExecution) {
        disposable.dispose();

        if (rejectOnExitCode && e.exitCode) {
          reject(e.exitCode);
        }

        resolve();
      }
    });
  });
}


