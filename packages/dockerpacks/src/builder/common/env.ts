import { Builder } from '@builder/builder';
import { isNonEmptyArray } from '@utils/types';

export const commonEnvBuilder: Builder<{ environments: string[] }> = {
  async detect() {
    return { hit: true };
  },
  async build(ctx) {
    const envItems: string[] = [];

    while (true) {
      const input = await ctx.prompt.input({
        id: 'environments',
        caption: '是否需要设置额外的环境变量？请按格式 ENV=VALUE 输入，按回车输入下一条变量或结束',
        validate: /^(?:[^=]+=[^=]*|\s*)$/i
      });
      if (!input.trim()) {
        break;
      }
      envItems.push(input);
    }

    ctx.message.pass('warn', `收集到 ${envItems.length} 条环境变量`);

    const args = envItems.map(item => item.split('=', 2) as [string, string]);

    return dockerfile => {
      if (isNonEmptyArray(args)) {
        dockerfile.env(...args).comment('用户设置的环境变量');
      }
    };
  }
};
