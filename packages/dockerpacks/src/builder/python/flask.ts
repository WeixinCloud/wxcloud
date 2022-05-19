import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';
import { REQUIREMENTS_TXT } from './constants';

export const flaskBuilder: Builder = {
  async detect(ctx) {
    return {
      hit: await checkIsFlask(ctx)
    };
  },
  async build() {
    return dockerfile => {
      dockerfile.copy('.', '.').comment('将所有文件拷贝到容器中');
      dockerfile.cmd('python3', '-m', 'flask', 'run', '--host=0.0.0.0').comment('启动 flask');
    };
  }
};

const REGEX = /^flask[^-]/im;

async function checkIsFlask(ctx: BuilderContext) {
  if (!(await ctx.files.exists(REQUIREMENTS_TXT))) {
    return false;
  }
  const content = await ctx.files.read(REQUIREMENTS_TXT);
  return REGEX.test(content);
}
