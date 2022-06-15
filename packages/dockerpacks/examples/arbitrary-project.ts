import { Dockerpacks, MessageHandler, MessageLevel, PromptIO } from '../dist';
import { prompt } from 'enquirer';

class ExamplePromptIO extends PromptIO {
  async ok(id: string, caption: string): Promise<boolean> {
    const response = await prompt({
      type: 'confirm',
      name: 'answer',
      message: caption
    });
    return response['answer'];
  }

  async input(id: string, caption: string): Promise<string> {
    const response = await prompt({
      type: 'input',
      name: 'answer',
      message: caption
    });
    return response['answer'];
  }

  async select(id: string, caption: string, options: [string, ...string[]]): Promise<number> {
    const response = await prompt({
      type: 'select',
      name: 'answer',
      message: caption,
      choices: options
    });
    return options.indexOf(response['answer']);
  }
}

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

  // Detect the projects using all the builder groups bundled.
  //
  // An `Error` or `DetectionError`(see src/runner/runner.ts) may be thrown.
  const result = await dockerpacks.detect(
    // Path to the root directory of the application to be analyzed.
    appRoot,

    // builder groups MAY ask some questions about the app,
    // here we use `HardCodedPromptIO` to handle them.
    new ExamplePromptIO(),

    // This argument is optional. By default an implementation that ignores
    // all the messages will be used.
    new ExampleMessageHandler(),

    // This argument is optional, it's used to decide which builder group to use
    // when multiple builder groups detect the project successfully.
    //
    // For example, given a Node project, the npm builder and the pnpm builder might
    // both pass their detection rules. You should decide or leave it to your user
    // to choose which builder to use.
    //
    // By default, the first of `groups` will be choosed.
    groups => 0
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

  // Example output:
  // ✔ Path to your app · /path/to/a/create-react-app/project
  // [info] 没有在 package.json 中找到 Node 版本约束，将使用推荐版本的 Node 镜像
  // [info] 将使用镜像 lts-alpine (16.15.0-alpine)
  // ✔ 是否需要设置额外的环境变量？请按格式 ENV=VALUE 输入，按回车输入下一条变量或结束 ·
  // [warn] 收集到 0 条环境变量
  // ✔ 您的项目监听哪个端口接收请求？例如：许多 Node 框架会监听 3000 端口 · 3000
  // [warn] 请将您的项目设置为监听 0.0.0.0 地址，否则部署后可能无法访问
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
  //     '# 运行编译\n' +
  //     'RUN npm run build\n' +
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
