import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';
import { COMPOSER_JSON } from './constants';

export const thinkPhpBuilder: Builder = {
  async detect(ctx) {
    const exists = await ctx.files.exists('./**/*.php');
    const isLaravel = await checkIsThinkPhp(ctx);
    return { hit: exists && isLaravel };
  },
  async build(ctx) {
    return dockerfile => {
      // TODO: maybe unsafe
      dockerfile.run('chmod', '-R', '777', './runtime');
    };
  }
};

async function checkIsThinkPhp(ctx: BuilderContext) {
  const json = await ctx.files.readJson(COMPOSER_JSON);
  if (
    json?.require &&
    Object.keys(json.require).some(item => item.startsWith('topthink/framework'))
  ) {
    return true;
  }
  return false;
}
