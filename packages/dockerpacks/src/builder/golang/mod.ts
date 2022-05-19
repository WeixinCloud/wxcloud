import { Builder } from '@builder/builder';
import { GO_MOD, GO_SUM, VENDOR_DIR } from './constants';

export const golangModuleBuilder: Builder = {
  async detect(ctx) {
    const exists = ctx.files.exists(GO_MOD);
    return { hit: exists };
  },
  async build(ctx) {
    const goSumExists = ctx.files.exists(GO_SUM);
    const vendorExists = ctx.files.exists(`${VENDOR_DIR}/*`);

    // 下面的行为假定当前的 golang 版本总是 1.16+
    // 如果 runtime builder 会提供其它版本的 golang，需要重新考虑下面的所有行为
    return dockerfile => {
      if (vendorExists) {
        return;
      }

      dockerfile.env('GOPROXY', 'https://mirrors.tencent.com/go').comment('使用速度更快的国内镜像');

      if (!goSumExists) {
        // 自 golang 1.16 开始，必须要通过这条命令生成 go.sum 才能确保 golang 可以成功编译
        dockerfile.run('go', 'mod', 'tidy');
      }

      dockerfile.run('go', 'mod', 'download');
    };
  }
};
