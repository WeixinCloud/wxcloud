import { IKitContext, IKitDeployTarget, Kit } from './common/kit';
import { CloudKits } from './kits';
import { logger } from './utils/debug';
export async function execAllKits(ctx: IKitContext): Promise<IKitDeployTarget> {
  // take kit according to ctx.config.type
  logger.debug('kit::type', ctx.config.type);
  const kits = CloudKits[ctx.config.type];
  // Parallel run kit detection
  const promises = kits.map(kit => kit.detect(ctx));
  const result = await Promise.all(promises);
  // Filter out not detected kits
  const detectedKits = kits.filter((kit, index) => result[index]);
  // if there is more than one kit is detected, ask user to choose one
  if (detectedKits.length > 1) {
    throw new Error('more than one kit detected.');
  }
  const targetKit = detectedKits[0];
  if (!targetKit) {
    throw new Error('no available kit detected.');
  }
  return await targetKit.run(ctx);
}
