import { Builder } from '@builder/builder';
import { BuilderContext, PROMPT_NON_EMPTY } from '@builder/context';
import { readFile } from 'fs/promises';
import JSZip from 'jszip';
import { MAIN_CLASS, MANIFEST_MF } from './constants';

export const javaEntrypointBuilder: Builder<{ entrypointJar: string }> = {
  async detect() {
    return { hit: true };
  },
  async build(ctx) {
    // 用户的本地仓库可能存在编译好的 jar，用它来推导出入口 jar 的路径
    const jars = await findExecutableJars(ctx);
    const entrypointJar =
      jars.length === 1
        ? ctx.files.toRelativePath(jars[0])
        : await ctx.prompt.input({
            id: 'entrypointJar',
            caption: '请输入您的项目的入口 jar 路径（例如: dist/main.jar）',
            validate: PROMPT_NON_EMPTY
          });
    ctx.message.pass(`将使用 ${entrypointJar} 作为入口 jar`);

    return dockerfile => {
      // TODO: 询问是否添加 jvm options
      dockerfile.cmd('java', '-jar', entrypointJar).comment('运行项目');
    };
  }
};

async function findExecutableJars(ctx: BuilderContext) {
  const result: string[] = [];
  const jarFiles = await ctx.files.glob('./**/*.jar', false);
  await Promise.all(
    jarFiles.map(async file => {
      if (await isExecutableJar(file)) {
        result.push(file);
      }
    })
  );
  return result;
}

async function isExecutableJar(file: string) {
  const data = await readFile(file);
  const zip = await JSZip.loadAsync(data);
  const content = await zip.file(MANIFEST_MF)?.async('string');
  if (!content) {
    return false;
  }
  return content.includes(`${MAIN_CLASS}: `);
}
