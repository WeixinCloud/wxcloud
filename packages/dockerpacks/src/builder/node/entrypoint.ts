import { Builder } from '@builder/builder';
import { BuilderContext, PROMPT_NON_EMPTY } from '@builder/context';
import { ENTRYPOINT_DISABLED } from '@builder/env';
import { NODE_ENV_PRODUCTION, PACKAGE_JSON } from './constants';
import { split } from 'split-cmd';
import { NonEmptyArray } from '@utils/types';

export const nodeEntrypointBuilder: Builder = {
  async detect(ctx) {
    return { hit: !ctx.env.has(ENTRYPOINT_DISABLED) };
  },
  async build(ctx) {
    const entrypoint =
      getEntrypoint(ctx) ??
      (await ctx.prompt.input({
        id: 'generalEntrypoint',
        caption: '请输入您的项目的启动命令（例如: node dist/index.js）',
        validate: PROMPT_NON_EMPTY,
        transform: input => split(input) as NonEmptyArray<string>
      }));

    return dockerfile => {
      dockerfile.env('NODE_ENV', NODE_ENV_PRODUCTION);
      dockerfile.cmd(...entrypoint).comment('运行项目');
    };
  }
};

function getEntrypoint(ctx: BuilderContext): NonEmptyArray<string> | null {
  const packageJson = ctx.files.readJson(PACKAGE_JSON);
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

  for (const s of START_SCRIPTS) {
    if (scripts[s]) {
      return s;
    }
  }

  return null;
}
