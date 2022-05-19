import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';
import { BUILD_GRADLE, BUILD_GRADLE_KTS } from './constants';

export const javaGradleBuilder: Builder = {
  async detect(ctx) {
    const exists = await ctx.files.someExists(BUILD_GRADLE, BUILD_GRADLE_KTS);
    return { hit: exists };
  },
  async build(ctx) {
    const image = await getRecommendedImage(ctx);
    const targetTag = image.getMostGeneralTag();
    ctx.message.pass(`将使用镜像 ${targetTag.raw} (${image.getFullVersionTag()})`);

    return dockerfile => {
      dockerfile.from('gradle', targetTag.raw).comment(`使用 Gradle 官方镜像`);
      dockerfile.workdir('/app').comment('设置容器内的当前目录');
      dockerfile.copy('.', '.').comment('将包括源文件在内的所有文件拷贝到容器中');
      dockerfile.run('gradle', 'clean', 'assemble', '-x', 'test', '--quiet').comment('编译项目');
    };
  }
};

async function getRecommendedImage(ctx: BuilderContext) {
  const image = await ctx.api.queryRecommendedImage('gradle');
  if (!image) {
    // TODO: should ask user to manually set version
    ctx.panic('未找到推荐的 Gradle 镜像，请联系客服');
  }
  return image;
}
