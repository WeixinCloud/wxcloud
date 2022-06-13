import { runDockerCommand } from '../utils/terminal';
import { getHostContainerByContainerID } from '../utils/utils';
import type { IWXContainerId } from '../types';

export async function attachShell(node?: IWXContainerId): Promise<void> {
  if (!node) return;

  const container = await getHostContainerByContainerID(node);
  if (!container) {
    throw new Error(`container instance for ${node.type}/${node.name} not found`);
  }

  return runDockerCommand({
    name: `${node.name}`,
    command: `docker exec -it ${container.Id} bash || sh`
  });
}
