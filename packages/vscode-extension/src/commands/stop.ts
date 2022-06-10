import * as vscode from 'vscode';
import { runDockerCommand } from '../utils/terminal';
import { getHostContainerByContainerID } from '../utils/utils';
import type { IWXContainerId } from '../types';

export async function stop(node?: IWXContainerId, nodes?: IWXContainerId[]): Promise<void> {
  if (!node && !nodes) return;
  await Promise.all((nodes || [node]).map(n => vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Stopping Container' }, async (_progress) => {
    try {
      return await stopOne(n);
    } catch (e) {
      vscode.window.showErrorMessage(`${e}`);
    }
  })));
}

async function stopOne(node?: IWXContainerId): Promise<void> {
  if (!node) {
    throw new Error('no node selected');
  }

  const container = await getHostContainerByContainerID(node);

  if (node.mode === 'compose') {
    await runDockerCommand({
      command: 'docker-compose down',
      name: node.name,
    });
    return;
  }

  if (container) {
    await runDockerCommand({
      command: `docker container stop ${container.Id}`,
      name: node.name,
    });
  }

  // if (local.container) {
  //   const c = cloudbase.dockerode.getContainer(local.container.Id)
  //   await c.stop()
  // }
}
