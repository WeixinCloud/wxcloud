import { Dockerpacks, HardCodedPromptIO, MessageHandler, MessageLevel } from '../dist';
import { prompt } from 'enquirer';

class ExampleMessageHandler implements MessageHandler {
  pass(level: MessageLevel, message: string) {
    console.log(`[${level}] ${message}`);
  }
}

async function main() {
  const appRoot = (await prompt({ type: 'input', name: 'answer', message: 'Path to your app' }))[
    'answer'
  ];

  const dockerpacks = new Dockerpacks();

  // Detect the project using a certain build group. It is useful when you
  // just want to generate Dockerfile for an already known project.
  //
  // An `Error` or `DetectionError`(see src/runner/runner.ts) may be thrown.
  const result = await dockerpacks.detectWithGroup(
    // The name of the builder group.
    // It's type-checked, change it and see what will happen.
    'node.npm',

    // Path to the root directory of the application to be analyzed.
    appRoot,

    // `node.npm` builder group MAY ask some questions about the app,
    // here we use `HardCodedPromptIO` to handle them.
    //
    // You can also provide your own implementation like in `arbitrary-project.ts`
    //
    // Note: The properties inside `PromptIO` implementations are type-checked,
    // remove one of the properties and see what will happen.
    new HardCodedPromptIO({
      environments: [],
      // The answers we wrote here MAY NOT be effective. For example,
      // the value of `generalEntrypoint` will be used ONLY WHEN `node.npm`
      // builder group cannot deduce a proper entrypoint for the project.
      generalEntrypoint: 'npm start',
      expose: '3000'
    }),

    // This argument is optional. By default an implementation that ignores
    // all the messages will be used.
    new ExampleMessageHandler()
  );

  // When all the builder groups fail to detect the project,
  // `result` will be `null`, which means that no builder group
  // is able to build the Dockerfile for the project.
  if (!result) {
    console.error("failed to detect the project, maybe it's unsupported");
    return;
  }

  // An `BuildError`(see src/runner/runner.ts) may be thrown
  const buildResult = await result.build();

  console.log('build result:');
  console.dir(buildResult);

  // Example output(notice how it's different from that in `arbitrary-project.ts`):
  // ✔ Path to your app · /Users/tomie/Tencent/cra-test
  // build result:
  // {
  //   dockerfile: '# 由 Dockerpacks 自动生成\n' +
  //     '# 本 Dockerfile 可能不能完全覆盖您的项目需求，若遇到问题请根据实际情况修改或询问客服\n' +
  //     '\n' +
  //     '# 使用基于 alpine 的 node 官方镜像\n' +
  //     'FROM node:lts-alpine\n' +
  //     '\n' +
  //     '# 设置容器内的当前目录\n' +
  //     'WORKDIR /app\n' +
  //     '\n' +
  //     '# 使用速度更快的国内镜像源\n' +
  //     'RUN npm config set registry https://registry.npmmirror.com\n' +
  //     '\n' +
  //     '# 将这些文件拷贝到容器中\n' +
  //     'COPY package.json package-lock.json ./\n' +
  //     '\n' +
  //     '# 安装依赖\n' +
  //     'RUN npm ci\n' +
  //     '\n' +
  //     '# 将包括源文件在内的所有文件拷贝到容器中（在 .dockerignore 中的文件除外）\n' +
  //     'COPY . .\n' +
  //     '\n' +
  //     '# 设置环境变量\n' +
  //     'ENV NODE_ENV=production HOST=0.0.0.0\n' +
  //     '\n' +
  //     '# 运行项目\n' +
  //     'CMD ["npm", "run", "start"]\n' +
  //     '\n' +
  //     '# 服务暴露的端口\n' +
  //     'EXPOSE 3000',
  //   files: Map(1) {
  //     '.dockerignore' => '.git\n.gitignore\n.dockerignore\nDockerfile*\nLICENSE\n*.md\nnode_modules'
  //   }
  // }
}

main().catch(console.error);
