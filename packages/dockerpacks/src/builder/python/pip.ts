import { Builder } from '@builder/builder';
import { REQUIREMENTS_TXT } from './constants';

export const pipBuilder: Builder = {
  async detect(ctx) {
    const exists = ctx.files.exists(REQUIREMENTS_TXT);
    return {
      hit: exists
    };
  },
  async build() {
    return dockerfile => {
      dockerfile
        .copy(REQUIREMENTS_TXT, REQUIREMENTS_TXT)
        .comment(`将 ${REQUIREMENTS_TXT} 复制到容器中`);
      dockerfile.run('python3', '-m', 'pip', 'install', '-r', REQUIREMENTS_TXT).comment('安装依赖');
    };
  }
};
