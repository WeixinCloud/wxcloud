import { Builder } from '@builder/builder';

export const phpExtensionsBuilder: Builder<{
  databaseExtensionSelection: string;
  databaseExtensionInput: string;
}> = {
  async detect(ctx) {
    const exists = await ctx.files.exists('./**/*.php');
    return { hit: exists };
  },
  async build(ctx) {
    let databaseExtension = await ctx.prompt.select({
      id: 'databaseExtensionSelection',
      caption: '选择要安装的数据库模块名称',
      options: ['pdo_mysql', 'pdo_pgsql', ['其它或不安装', null]]
    });

    if (databaseExtension === null) {
      const answer = await ctx.prompt.input({
        id: 'databaseExtensionInput',
        caption: '请输入模块名称（留空则不安装）'
      });
      if (answer) {
        databaseExtension = answer;
      }
    }

    return dockerfile => {
      if (databaseExtension) {
        dockerfile.run('install-php-extensions', databaseExtension).comment('安装数据库模块');
      }
    };
  }
};
