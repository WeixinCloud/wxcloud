import { runDockerCommand } from '../utils/terminal';
import { getHostContainerByContainerID } from '../utils/utils';
import type { IWXContainerId } from '../types';

export async function viewLogs(node?: IWXContainerId): Promise<void> {
  if (!node) return;

  const container = await getHostContainerByContainerID(node);
  if (!container) {
    throw new Error(`container instance for ${node.type}/${node.name} not found`);
  }

  return runDockerCommand({
    name: `${node.name} logs`,
    command: `docker logs --tail 1000 -f ${container.Id}`
  });

  /*
  const task = new vscode.Task(
    { type: 'shell' },
    vscode.TaskScope.Workspace,
    `${node.name} logs`,
    'Docker',
    new vscode.ShellExecution(`docker logs --tail 1000 -f ${local.container.Id}`, {
      cwd: vscode.workspace.workspaceFolders[0].uri?.fsPath,
    }),
    [],
  )

  const taskExecution = await vscode.tasks.executeTask(task)

  return new Promise<void>((resolve, reject) => {
    const disposable = vscode.tasks.onDidEndTaskProcess(e => {
      if (e.execution === taskExecution) {
        disposable.dispose()

        // if (e.exitCode) {
        //   reject(e.exitCode)
        // }

        resolve()
      }
    })
  })
  */
}
