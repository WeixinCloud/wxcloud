import { Builder } from '@builder/builder';
import { PROMPT_NON_EMPTY } from '@builder/context';
import { EXPOSE_PORT, NGINX_ENABLED } from '@builder/env';
import { trim } from 'lodash';
import { join } from 'path';
import { phpNginxConf } from './conf/nginx.conf';
import { NGINX_CONF_PATH } from './constants';

export const nginxBuilder: Builder<{ staticDirectory: string }> = {
  async detect() {
    return { hit: true };
  },
  async build(ctx) {
    ctx.env.set(NGINX_ENABLED);

    const rootPath = await ctx.prompt.input({
      id: 'staticDirectory',
      caption: '请输入静态文件夹路径（例如 public），不存在时，默认使用 public',
      validate: PROMPT_NON_EMPTY,
      transform: input => trim(input, '/ '),
      default: 'public'
    });

    const nginxConfPath = await ctx.files.write('nginx.conf', phpNginxConf(rootPath));

    return dockerfile => {
      dockerfile
        .run(
          'apt',
          'update',
          '-qq',
          '&&',
          'apt',
          'install',
          '-qq',
          '-y',
          '--no-install-recommends',
          'nginx'
        )
        .comment('安装 nginx');

      dockerfile
        .run(
          'ln',
          '-sf',
          '/dev/stdout',
          '/var/log/nginx/access.log',
          '&&',
          'ln',
          '-sf',
          '/dev/stderr',
          '/var/log/nginx/error.log'
        )
        .comment('将 nginx 日志输出到标准输出流和标准错误流中，这是容器应用中推荐的实践');

      ctx.env.set(EXPOSE_PORT, '80');

      dockerfile
        .copy(join('.', nginxConfPath), NGINX_CONF_PATH)
        .comment('用生成的 nginx.conf 替换掉默认配置，您可以随时修改生成的 nginx.conf 文件');
    };
  }
};
