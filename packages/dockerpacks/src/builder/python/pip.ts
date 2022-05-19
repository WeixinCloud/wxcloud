import { Builder } from '@builder/builder';
import { REQUIREMENTS_TXT, TENCENT_INDEX_URL, TENCENT_MIRRORS_HOST } from './constants';

export const pipBuilder: Builder = {
  async detect(ctx) {
    const exists = await ctx.files.exists(REQUIREMENTS_TXT);
    return {
      hit: exists
    };
  },
  async build() {
    return dockerfile => {
      dockerfile
        .run(
          ['python3', '-m', 'pip', 'config', 'set', 'global.trusted-host', TENCENT_MIRRORS_HOST],
          ['python3', '-m', 'pip', 'config', 'set', 'global.index-url', TENCENT_INDEX_URL]
        )
        .comment('使用速度更快的国内镜像');

      dockerfile
        .copy(REQUIREMENTS_TXT, REQUIREMENTS_TXT)
        .comment(`将 ${REQUIREMENTS_TXT} 复制到容器中`);
      dockerfile.run('python3', '-m', 'pip', 'install', '-r', REQUIREMENTS_TXT).comment('安装依赖');
    };
  }
};
