import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';
import { NODE_PACKAGE_MANAGER, NODE_VERSION } from '@builder/env';
import { NonEmptyArray } from '@utils/types';
import { lt } from 'semver';
import { NPM_SHRINKWRAP_JSON, PACKAGE_JSON, PACKAGE_LOCK_JSON, NPM_REGISTRY } from './constants';

export const npmBuilder: Builder = {
  async detect(ctx) {
    const exists = await ctx.files.exists(PACKAGE_JSON);
    return {
      hit: exists
    };
  },
  async build(ctx) {
    const lockFileName = await getLockFileName(ctx);
    const installCmd = getNpmInstallCmd(ctx, !!lockFileName);

    ctx.env.set(NODE_PACKAGE_MANAGER, 'npm');

    return (dockerfile, ignore) => {
      dockerfile
        .run('npm', 'config', 'set', 'registry', NPM_REGISTRY)
        .comment('使用速度更快的国内镜像源');

      if (!lockFileName) {
        dockerfile.copy(PACKAGE_JSON, '.').comment('将 package.json 拷贝到容器中');
      } else {
        dockerfile.copy(PACKAGE_JSON, lockFileName, './').comment('将这些文件拷贝到容器中');
      }
      dockerfile.run(...installCmd).comment('安装依赖'); // TODO: prune

      ignore.append('node_modules');
      dockerfile
        .copy('.', '.')
        .comment('将包括源文件在内的所有文件拷贝到容器中（在 .dockerignore 中的文件除外）');
    };
  }
};

function getNpmInstallCmd(ctx: BuilderContext, hasLockfile: boolean): NonEmptyArray<string> {
  const version = ctx.env.mustGet(NODE_VERSION);
  if (!hasLockfile || lt(version, '11.0.0')) {
    return ['npm', 'install'];
  } else {
    return ['npm', 'ci'];
  }
}

async function getLockFileName(ctx: BuilderContext): Promise<string | null> {
  if (await ctx.files.exists(NPM_SHRINKWRAP_JSON)) {
    return NPM_SHRINKWRAP_JSON;
  }
  if (await ctx.files.exists(PACKAGE_LOCK_JSON)) {
    return PACKAGE_LOCK_JSON;
  }
  return null;
}
