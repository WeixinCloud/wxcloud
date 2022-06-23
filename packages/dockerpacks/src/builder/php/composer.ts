import { Builder } from '@builder/builder';
import { COMPOSER_JSON, VENDOR_PATH } from './constants';

export const phpComposerBuilder: Builder = {
  async detect(ctx) {
    const exists = await ctx.files.exists(COMPOSER_JSON, `${VENDOR_PATH}/*`);
    return { hit: exists };
  },
  async build() {
    return dockerfile => {
      dockerfile.run('install-php-extensions', '@composer', 'gd').comment('安装 composer 和 gd');

      dockerfile.run('rm', '-rf', 'vendor').comment('移除容器中的 vendor 文件夹');
      dockerfile.run('composer', 'update').comment('更新 composer 依赖');
      dockerfile
        .run(
          'composer',
          'install',
          '--no-dev',
          '--no-progress',
          '--no-interaction',
          '--optimize-autoloader'
        )
        .comment('使用 composer 重新安装依赖');
    };
  }
};
