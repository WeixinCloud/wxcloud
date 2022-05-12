import { Builder } from '@builder/builder';
import { BuilderContext } from '@builder/context';
import { MANAGE_PY, REQUIREMENTS_TXT } from './constants';

export const djangoBuilder: Builder = {
  async detect(ctx) {
    return {
      hit: checkIsDjango(ctx)
    };
  },
  async build() {
    return dockerfile => {
      dockerfile.copy('.', '.').comment('将所有文件拷贝到容器中');
      dockerfile.cmd('python3', 'manage.py', '0.0.0.0').comment('启动 django');
    };
  }
};

const REGEX = /^django[^-]/im;

function checkIsDjango(ctx: BuilderContext) {
  if (!ctx.files.exists(REQUIREMENTS_TXT)) {
    return false;
  }
  const content = ctx.files.read(REQUIREMENTS_TXT);
  const hasDjango = REGEX.test(content);
  const hasManagePy = ctx.files.exists(MANAGE_PY);
  return hasDjango && hasManagePy;
}
