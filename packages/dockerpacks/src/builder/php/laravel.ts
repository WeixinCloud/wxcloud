import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';
import { COMPOSER_JSON } from './constants';

export const laravelBuilder: Builder = {
  async detect(ctx) {
    const exists = await ctx.files.exists('./**/*.php');
    const isLaravel = await checkIsLaravel(ctx);
    return { hit: exists && isLaravel };
  },
  async build() {
    return dockerfile => {
      // TODO: maybe unsafe
      dockerfile.run('chmod', '-R', '777', './storage');
    };
  }
};

async function checkIsLaravel(ctx: BuilderContext) {
  const json = await ctx.files.readJson(COMPOSER_JSON);
  if (json?.require && Object.keys(json.require).some(item => item.startsWith('laravel/'))) {
    return true;
  }
  return false;
}
