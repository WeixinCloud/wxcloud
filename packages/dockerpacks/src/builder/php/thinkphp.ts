import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';
import { COMPOSER_JSON } from './constants';

export const thinkPhpBuilder: Builder = {
  async detect(ctx) {
    const exists = ctx.files.exists('./**/*.php');
    const isLaravel = checkIsThinkPhp(ctx);
    return { hit: exists && isLaravel };
  },
  async build() {
    return dockerfile => {
      // TODO: maybe unsafe
      dockerfile.run('chmod', '-R', '777', './runtime');
    };
  }
};

function checkIsThinkPhp(ctx: BuilderContext) {
  const json = ctx.files.readJson(COMPOSER_JSON);
  if (
    json?.require &&
    Object.keys(json.require).some(item => item.startsWith('topthink/framework'))
  ) {
    return true;
  }
  return false;
}
