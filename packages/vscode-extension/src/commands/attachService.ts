import ext from '../core/global';
import { getHostContainerByContainerID } from '../utils/utils';

import type { IWXContainerId } from '../types';

export async function attachService(node?: IWXContainerId): Promise<void> {
  if (!node) return;

  const container = await getHostContainerByContainerID(node);
  if (!container) {
    throw new Error(`container instance for ${node.type}/${node.name} not found`);
  }
  node.attached = true;
  return ext.backend.attachService({
    wxPort: +(container.Labels.wxPort || '27082'),
    service: container.Labels.wxcloud,
  });
}

export async function detachService(node?: IWXContainerId): Promise<void> {
  if (!node) return;

  const container = await getHostContainerByContainerID(node);
  if (!container) {
    throw new Error(`container instance for ${node.type}/${node.name} not found`);
  }
  node.attached = false;
  return ext.backend.detachService({
    service: container.Labels.wxcloud,
  });
}
