import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';
import { NODE_PACKAGE_MANAGER } from '@builder/env';
import { PACKAGE_JSON } from './constants';

export const buildBuilder: Builder = {
  async detect(ctx) {
    return {
      hit: !!(await getBuildScript(ctx))
    };
  },
  async build(ctx) {
    const packageManager = ctx.env.mustGet(NODE_PACKAGE_MANAGER);
    const buildScript = (await getBuildScript(ctx))!;

    return dockerfile => {
      dockerfile.run(packageManager, 'run', buildScript).comment('运行编译');
    };
  }
};

const BUILD_SCRIPTS = ['build:production', 'build:prod', 'build'];

async function getBuildScript(ctx: BuilderContext) {
  const exists = await ctx.files.exists(PACKAGE_JSON);
  if (!exists) {
    return null;
  }
  const json = await ctx.files.readJson(PACKAGE_JSON);

  for (const script of BUILD_SCRIPTS) {
    if (json?.scripts?.[script]) {
      return script;
    }
  }

  return null;
}
