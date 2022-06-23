import { ServerApi } from '@api/server';
import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';
import { COMPOSER_JSON } from './constants';

export const phpFpmBuilder: Builder = {
  async detect(ctx) {
    const exists = await ctx.files.exists('./**/*.php');
    return { hit: exists };
  },
  async build(ctx) {
    const wrapper = await inferRuntimeImage(ctx);
    const targetTag = wrapper.getMostGeneralTag();
    ctx.message.pass('info', `将使用镜像 ${targetTag.raw} (${wrapper.getFullVersionTag()})`);

    return dockerfile => {
      dockerfile.from('php', targetTag.raw).comment('使用 php 官方提供的镜像，内置 fpm');

      dockerfile
        .add(
          new URL(
            'gh/mlocati/docker-php-extension-installer@latest/install-php-extensions',
            ServerApi.TCB_SHANGHAI.getServerUrl()
          ).toString(),
          '/usr/local/bin'
        )
        .comment(
          '安装 install-php-extensions 工具，您可以使用它来安装自己需要的 php 扩展，请参考：https://github.com/mlocati/docker-php-extension-installer\n例如，使用 RUN install-php-extensions @composer 来安装 composer'
        );
      dockerfile.run('chmod', '+x', '/usr/local/bin/install-php-extensions');

      dockerfile.workdir('/app').comment('设置容器内的当前目录');

      // TODO: should have been as late as possible
      dockerfile.copy('.', '.').comment('将包括源文件在内的所有文件拷贝到容器中');
    };
  }
};

async function inferRuntimeImage(ctx: BuilderContext) {
  if (!(await ctx.files.exists(COMPOSER_JSON))) {
    ctx.message.pass('info', '没有找到 composer.json，将使用推荐版本的 PHP 镜像');
    return await getRecommendedVersionTag(ctx);
  }

  const composerJson = await ctx.files.readJson(COMPOSER_JSON);
  const versionConstraint = composerJson?.require?.php;
  if (!versionConstraint) {
    ctx.message.pass('info', '没有在 composer.json 中找到 PHP 版本约束，将使用推荐版本的 PHP 镜像');
    return await getRecommendedVersionTag(ctx);
  }

  ctx.message.pass('info', `在 composer.json 中找到了 PHP 版本约束 ${versionConstraint}`);
  const wrapper = await ctx.api.queryRuntimeImage('php', versionConstraint, ['fpm']);
  if (!wrapper) {
    ctx.message.pass(
      'info',
      `您在 composer.json 中对 PHP 版本的约束 ${versionConstraint} 已经太旧或无效，将为您使用推荐版本的 PHP 镜像`
    );
    return await getRecommendedVersionTag(ctx);
  }

  return wrapper;
}

async function getRecommendedVersionTag(ctx: BuilderContext) {
  const wrapper = await ctx.api.queryRecommendedImage('php', ['fpm', 'buster']);
  if (!wrapper) {
    // TODO: should ask user to manually set version
    ctx.panic('未找到推荐的版本，请联系客服');
  }
  return wrapper;
}
