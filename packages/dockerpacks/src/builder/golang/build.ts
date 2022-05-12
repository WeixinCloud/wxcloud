import { Builder } from '@builder/builder';
import { WXCLOUDRUN_FILES_DIR } from '@builder/constants';

export const golangBuildBuilder: Builder = {
  async detect(ctx) {
    const exists = ctx.files.exists('./**/*.go');
    return { hit: exists };
  },
  async build() {
    return dockerfile => {
      dockerfile.run('go', 'build', '-o', `${WXCLOUDRUN_FILES_DIR}/main`);
      dockerfile.cmd(`${WXCLOUDRUN_FILES_DIR}/main`);
    };
  }
};
