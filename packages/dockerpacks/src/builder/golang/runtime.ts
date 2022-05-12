import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';

export const golangRuntimeBuilder: Builder = {
  async detect(ctx) {
    const exists = ctx.files.exists('./**/*.go');
    return { hit: exists };
  },
  async build(ctx) {
    const image = await getRecommendedImage(ctx);
    const targetTag = image.getMostGeneralTag();
    ctx.message.pass(`将使用镜像 ${targetTag.raw} (${image.getFullVersionTag()})`);

    return dockerfile => {
      dockerfile.from('golang', targetTag.raw).comment(`使用基于 alpine 的 golang 官方镜像`);
      dockerfile.workdir('/app').comment('设置容器内的当前目录');
      dockerfile.copy('.', '.').comment('将包括源文件在内的所有文件拷贝到容器中');
    };
  }
};

async function getRecommendedImage(ctx: BuilderContext) {
  const image = await ctx.api.queryRecommendedImage('golang', ['alpine']);
  if (!image) {
    // TODO: should ask user to manually set version
    ctx.panic('未找到推荐的 Python 镜像，请联系客服');
  }
  return image;
}
