import { Builder } from '@builder/builder';
import { DISABLE_HOST_WARNING, EXPOSE_PORT } from '@builder/env';

export const commonExposeBuilder: Builder<{ expose: string }> = {
  async detect() {
    return { hit: true };
  },
  async build(ctx) {
    const port = ctx.env.has(EXPOSE_PORT)
      ? ctx.env.mustGet(EXPOSE_PORT)
      : await ctx.prompt.input({
          id: 'expose',
          caption: '您的项目监听哪个端口接收请求？例如：许多 Node 框架会监听 3000 端口',
          validate: (input: string) => {
            const port = Number(input);
            if (!port) {
              return false;
            }
            return 1 <= port && port <= 65535;
          }
        });

    if (!ctx.env.has(DISABLE_HOST_WARNING)) {
      ctx.message.pass('请将您的项目设置为监听 0.0.0.0 地址，否则部署后可能无法访问', 'warn');
    }

    return dockerfile => {
      dockerfile.expose(port).comment('服务暴露的端口');
    };
  }
};
