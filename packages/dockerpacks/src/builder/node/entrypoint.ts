import { Builder } from '@builder/builder';
import { BuilderContext, PROMPT_NON_EMPTY } from '@builder/context';
import { ENTRYPOINT_DISABLED } from '@builder/env';
import { NODE_ENV_PRODUCTION, PACKAGE_JSON } from './constants';
import { split } from 'split-cmd';
import { NonEmptyArray } from '@utils/types';

export const nodeEntrypointBuilder: Builder<{ generalEntrypoint: string }> = {
  async detect(ctx) {
    return { hit: !ctx.env.has(ENTRYPOINT_DISABLED) };
  },
  async build(ctx) {
    const entrypoint =
      (await getEntrypoint(ctx)) ??
      (await ctx.prompt.input({
        id: 'generalEntrypoint',
        caption: '请输入您的项目的启动命令（例如: node dist/index.js）',
        validate: PROMPT_NON_EMPTY,
        transform: input => split(input) as NonEmptyArray<string>
      }));

    return dockerfile => {
      dockerfile
        .env(['NODE_ENV', NODE_ENV_PRODUCTION], ['HOST', '0.0.0.0'])
        .comment('设置环境变量');
      dockerfile.cmd(...entrypoint).comment('运行项目');
    };
  }
};

async function getEntrypoint(ctx: BuilderContext): Promise<NonEmptyArray<string> | null> {
  const packageJson = await ctx.files.readJson(PACKAGE_JSON);
  const startScript = getStartScript(packageJson);
  if (startScript) {
    return ['npm', 'run', startScript];
  }

  if (packageJson?.main) {
    return ['node', packageJson.main];
  }

  return null;
}

const START_SCRIPTS = ['start:production', 'start:prod', 'start', 'serve'];

export function getStartScript(packageJson?: Record<string, any>): string | null {
  if (!packageJson) {
    return null;
  }

  const scripts = packageJson.scripts;
  if (!scripts) {
    return null;
  }

  for (const script of START_SCRIPTS) {
    if (scripts[script]) {
      return script;
    }
  }

  return null;
}
