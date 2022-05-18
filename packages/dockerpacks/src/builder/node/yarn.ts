import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';
import { parse } from 'yaml';
import { PACKAGE_JSON, TENCENT_NPM_REGISTRY, YARN_LOCK } from './constants';
import { NODE_PACKAGE_MANAGER } from '@builder/env';
import { NonEmptyArray } from '@utils/types';

export const yarnBuilder: Builder = {
  async detect(ctx) {
    const exists = ctx.files.everyExists(PACKAGE_JSON, YARN_LOCK);
    return {
      hit: exists
    };
  },
  async build(ctx) {
    const yarnVersion = await inferYarnVersion(ctx);
    const installCmd = getYarnInstallCommand(yarnVersion);

    ctx.env.set(NODE_PACKAGE_MANAGER, 'yarn');

    return (dockerfile, ignore) => {
      // node 镜像目前已经自带 yarn v1
      if (!yarnVersion.startsWith('1')) {
        dockerfile
          .run(
            'npm',
            'install',
            '-g',
            `yarn@${yarnVersion}`,
            `--registry="${TENCENT_NPM_REGISTRY}"`
          )
          .comment(`使用国内镜像源加速安装 yarn ${yarnVersion}`);
      }

      dockerfile
        .run(
          'yarn',
          'config',
          'set',
          yarnVersion.startsWith('1') ? 'registry' : 'npmRegistryServer',
          TENCENT_NPM_REGISTRY
        )
        .comment('使用速度更快的国内镜像源');
      dockerfile.copy(PACKAGE_JSON, YARN_LOCK, './').comment('将这些文件拷贝到容器中');
      dockerfile.run(...installCmd).comment('安装依赖'); // TODO: prune

      ignore.append('node_modules');
      dockerfile
        .copy('.', '.')
        .comment('将包括源文件在内的所有文件拷贝到容器中（在 .dockerignore 中的文件除外）');
    };
  }
};

async function inferYarnVersion(ctx: BuilderContext) {
  const packageJson = ctx.files.readJson(PACKAGE_JSON);
  const constraint = packageJson?.engines?.yarn || (isYarn2(ctx) ? '2' : '1');

  const version = await ctx.api.queryNpmPackage('yarn', constraint);
  if (!version) {
    ctx.panic('未找到合适的 yarn 版本，请联系客服');
  }

  return version;
}

function isYarn2(ctx: BuilderContext) {
  const content = ctx.files.read(YARN_LOCK);
  if (content.substring(0, 100).includes('yarn lockfile v1')) {
    return false;
  }
  try {
    parse(content);
    return true;
  } catch {
    return false;
  }
}

function getYarnInstallCommand(version: string): NonEmptyArray<string> {
  if (version.startsWith('1.')) {
    return ['yarn', 'install', '--non-interactive', '--prefer-offline'];
  }
  return ['yarn', 'install', '--immutable'];
}
