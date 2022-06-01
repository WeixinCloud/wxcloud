import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';
import { optArg } from '@utils/utils';
import { MVN_EXTENSIONS_XML, POM_XML, SETTINGS_XML } from './constants';

export const javaMavenBuilder: Builder = {
  async detect(ctx) {
    const exists = await ctx.files.someExists(POM_XML, MVN_EXTENSIONS_XML);
    return { hit: exists };
  },
  async build(ctx) {
    const image = await getRecommendedImage(ctx);
    const targetTag = image.getMostGeneralTag();
    ctx.message.pass('info', `将使用镜像 ${targetTag.raw} (${image.getFullVersionTag()})`);

    const hasSettingsXml = await ctx.files.exists(SETTINGS_XML);

    return dockerfile => {
      dockerfile.from('maven', targetTag.raw).comment(`使用 Maven 官方镜像`);
      dockerfile.workdir('/app').comment('设置容器内的当前目录');
      dockerfile.copy('.', '.').comment('将包括源文件在内的所有文件拷贝到容器中');
      dockerfile
        .run(
          'mvn',
          ...optArg(hasSettingsXml, ['-s', SETTINGS_XML]),
          'clean',
          'package',
          '--batch-mode',
          '-DskipTests',
          '-Dhttp.keepAlive=false',
          '--quiet'
        )
        .comment('编译项目');
    };
  }
};

async function getRecommendedImage(ctx: BuilderContext) {
  const image = await ctx.api.queryRecommendedImage('maven');
  if (!image) {
    // TODO: should ask user to manually set version
    ctx.panic('未找到推荐的 Maven 镜像，请联系客服');
  }
  return image;
}
