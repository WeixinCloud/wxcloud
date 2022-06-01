import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';
import { NODE_VERSION } from '@builder/env';
import { PACKAGE_JSON } from './constants';

export const nodeRuntimeBuilder: Builder = {
  async detect(ctx) {
    const exists = await ctx.files.someExists(PACKAGE_JSON, './**/*.{js,jsx,ts,tsx}');
    return { hit: exists };
  },
  async build(ctx) {
    const wrapper = await inferNodeImage(ctx);
    const targetTag = wrapper.getMostGeneralTag();
    ctx.message.pass('info', `将使用镜像 ${targetTag.raw} (${wrapper.getFullVersionTag()})`);

    const npmVersion = await inferNpmVersion(ctx);

    ctx.env.set(NODE_VERSION, wrapper.getFullVersion());

    return dockerfile => {
      dockerfile.from('node', targetTag.raw).comment(`使用基于 alpine 的 node 官方镜像`);

      if (npmVersion) {
        dockerfile.run('npm', 'install', '-g', `npm@${npmVersion}`).comment('安装指定版本的 npm');
      }

      dockerfile.workdir('/app').comment('设置容器内的当前目录');
    };
  }
};

async function inferNodeImage(ctx: BuilderContext) {
  const packageJson = await ctx.files.readJson(PACKAGE_JSON);
  const constraint = packageJson?.engines?.node;
  if (!constraint) {
    ctx.message.pass(
      'info',
      '没有在 package.json 中找到 Node 版本约束，将使用推荐版本的 Node 镜像'
    );
    return await getRecommendedNodeImage(ctx);
  }

  const wrapper = await ctx.api.queryRuntimeImage('node', constraint, ['alpine']);
  if (!wrapper) {
    ctx.message.pass(
      'info',
      `您在 package.json 中对 Node 版本的约束 ${constraint} 已经太旧或无效，将为您使用推荐版本的 Node 镜像`
    );
    return await getRecommendedNodeImage(ctx);
  }

  return wrapper;
}

async function getRecommendedNodeImage(ctx: BuilderContext) {
  const wrapper = await ctx.api.queryRecommendedImage('node', ['alpine']);
  if (!wrapper) {
    // TODO: should ask user to manually set version
    ctx.panic('未找到推荐的版本，请联系客服');
  }
  return wrapper;
}

async function inferNpmVersion(ctx: BuilderContext): Promise<string | null> {
  const packageJson = await ctx.files.readJson(PACKAGE_JSON);
  const constraint = packageJson?.engines?.npm;
  if (!constraint) {
    return null;
  }
  const version = await ctx.api.queryNpmPackage('npm', constraint);
  return version;
}
