import { split } from 'split-cmd';
import { Builder } from '@builder/builder';
import { PROMPT_NON_EMPTY } from '@builder/context';
import { ENTRYPOINT_DISABLED } from '@builder/env';
import { NonEmptyArray } from '@utils/types';

export const pythonEntrypointBuilder: Builder<{ entrypoint: string }> = {
  async detect(ctx) {
    return { hit: !ctx.env.has(ENTRYPOINT_DISABLED) };
  },
  async build(ctx) {
    const entrypoint = await ctx.prompt.input({
      id: 'entrypoint',
      caption: '请输入您的项目的启动命令（例如: python3 main.py）',
      validate: PROMPT_NON_EMPTY,
      transform: input => split(input) as NonEmptyArray<string>
    });

    return dockerfile => {
      dockerfile.cmd(...entrypoint).comment('运行项目');
    };
  }
};
