import { Builder } from '@builder/builder';
import { ENTRYPOINT_DISABLED, NGINX_ENABLED } from '@builder/env';

export const phpEntrypointBuilder: Builder = {
  async detect(ctx) {
    return { hit: !ctx.env.has(ENTRYPOINT_DISABLED) };
  },
  async build(ctx) {
    return dockerfile => {
      if (ctx.env.has(NGINX_ENABLED)) {
        dockerfile
          .cmd('sh', '-c', "php-fpm -D && nginx -g 'daemon off;'")
          .comment('后台启动 fpm，然后前台启动 nginx');
      } else {
        dockerfile.cmd('php-fpm').comment('启动 fpm');
      }
    };
  }
};
