import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';
import { PACKAGE_JSON, PNPM_LOCK_YAML, PNPM_LOCK_YML, NPM_REGISTRY } from './constants';
import { NODE_PACKAGE_MANAGER } from '@builder/env';

export const pnpmBuilder: Builder = {
  async detect(ctx) {
    const packageJsonExists = ctx.files.exists(PACKAGE_JSON);
    const lockExists = ctx.files.someExists(PNPM_LOCK_YML, PNPM_LOCK_YAML);
    return { hit: packageJsonExists && lockExists };
  },
  async build(ctx) {
    const version = await inferPnpmVersion(ctx);

    const isYaml = ctx.files.exists(PNPM_LOCK_YAML);

    ctx.env.set(NODE_PACKAGE_MANAGER, 'pnpm');

    return (dockerfile, ignore) => {
      dockerfile
        .run('npm', 'config', 'set', 'registry', NPM_REGISTRY)
        .comment('使用速度更快的国内镜像源');
      dockerfile.run('npm', 'install', '-g', `pnpm@${version}`).comment('安装 pnpm');

      dockerfile
        .copy(PACKAGE_JSON, isYaml ? PNPM_LOCK_YAML : PNPM_LOCK_YML, './')
        .comment('将这些文件拷贝到容器中');
      dockerfile.env('CI', 'true').comment('为 pnpm 设置的环境变量');
      dockerfile.run('pnpm', 'install', '--prefer-offline').comment('安装依赖'); // TODO: prune

      ignore.append('node_modules');
      dockerfile
        .copy('.', '.')
        .comment('将包括源文件在内的所有文件拷贝到容器中（在 .dockerignore 中的文件除外）');
    };
  }
};

async function inferPnpmVersion(ctx: BuilderContext) {
  const packageJson = ctx.files.readJson(PACKAGE_JSON);
  const constraint = packageJson?.engines?.pnpm;

  let version: string | null = null;
  if (constraint) {
    version = await ctx.api.queryNpmPackage('pnpm', constraint);
  }
  if (!version) {
    version = await ctx.api.queryNpmPackage('pnpm', 'latest');
  }
  if (!version) {
    ctx.panic('未找到合适的 pnpm 版本，请联系客服');
  }

  return version;
}
