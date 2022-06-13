import { runDockerCommand } from '../utils/terminal';
import { getHostContainerByContainerID } from '../utils/utils';
import type { IWXContainerId } from '../types';

export async function attachShell(node?: IWXContainerId): Promise<void> {
  if (!node) return;

  const container = await getHostContainerByContainerID(node);
  if (!container) {
    throw new Error(`container instance for ${node.type}/${node.name} not found`);
  }
  let shellCommand: string;
  // On Linux containers, check if bash is present
  // If so use it, otherwise use sh
  try {
    // If this succeeds, bash is present (exit code 0)
    await runDockerCommand({
      name: `${node.name}`,
      command: `docker exec -i ${container.Id} sh -c "which bash"`,
      rejectOnExitCode: true,
    });
    shellCommand = 'bash';
  } catch {
    shellCommand = 'sh';
  }

  return runDockerCommand({
    name: `${node.name}`,
    command: `docker exec -it ${container.Id} ${shellCommand}`
  });
}
