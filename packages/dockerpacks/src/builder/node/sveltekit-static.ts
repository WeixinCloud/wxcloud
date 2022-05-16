import { Builder } from '@builder/builder';
import { PACKAGE_JSON } from './constants';

export const svelteKitStaticBuilder: Builder = {
  async detect(ctx) {
    let hit = false;
    if (ctx.files.exists(PACKAGE_JSON)) {
      const packageJson = ctx.files.readJson(PACKAGE_JSON)!;
      const dependencies = [
        ...Object.keys(packageJson.dependencies ?? []),
        ...Object.keys(packageJson.devDependencies ?? [])
      ];
      hit =
        dependencies.includes('@sveltejs/kit') && dependencies.includes('@sveltejs/adapter-static');
    }
    return { hit };
  },
  async build(ctx) {
    ctx.message.pass(
      '您似乎正在使用 SvelteKit 的 adapter-static，请切换到 adapter-node，否则服务将无法运行您的项目',
      'fatal'
    );
    return ctx.panic('暂不支持 SvelteKit 的 adapter-static');
  }
};
