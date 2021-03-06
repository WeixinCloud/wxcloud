import path from 'path';
import * as inquirer from 'inquirer';
import {
  Dockerpacks,
  MessageHandler,
  PromptIO,
  MessageLevel,
  DockerpacksBuildResult,
  DockerpacksBuilder,
  BuildGroupSelectorFn,
  BuildGroupForSelection
} from '@wxcloud/dockerpacks';
import { Command, flags } from '@oclif/command';
import { existsSync } from 'fs';
import { Listr, PromptOptions } from 'listr2';
import { isDirectoryEmpty, isDirectoryExists } from '../../utils/file';
import { serializeError } from '../../utils/errors';
import { wrapDebug, wrapError, wrapInfo, wrapWarn } from '../../utils/colors';
import { DEFAULT_CLOUD_CONFIG, DEFAULT_CLOUD_CONFIG_JS_CONTENT } from '@wxcloud/core';
import ora from 'ora';
import { writeFileLogged } from '../../functions/writeFileLogged';

export class MigrateCommand extends Command {
  static description = '迁移项目到云托管';
  static examples = [`wxcloud migrate <项目根目录>`];

  static args = [{ name: 'path', description: '项目根目录', default: '.' }];
  static flags = {
    help: flags.help({ char: 'h', description: '查看帮助信息' })
  };

  async run() {
    const { args } = this.parse(MigrateCommand);
    const appRoot = path.resolve(args.path);

    if (!isDirectoryExists(appRoot)) {
      this.error('指定的文件夹不存在');
    }
    if (isDirectoryEmpty(appRoot)) {
      this.error('指定的文件夹为空');
    }

    if (existsSync(path.join(appRoot, 'Dockerfile'))) {
      const answer = (
        await inquirer.prompt([
          {
            type: 'confirm',
            name: 'answer',
            message: '指定的文件夹已经存在 Dockerfile，是否删除并继续'
          }
        ])
      ).answer;
      if (!answer) {
        return;
      }
    }

    const dockerpacks = new Dockerpacks();
    const messageHandler = new CliMessageHandler();
    const promptIo = new CliPromptIO();

    const tasks = new Listr(
      [
        {
          title: '分析项目文件',
          task: async (ctx, task) => {
            messageHandler.setOutput(task.stdout());
            promptIo.setPrompt(async (...args) => await task.prompt(...args));

            const selectorFn: BuildGroupSelectorFn = async (groups: BuildGroupForSelection[]) => {
              const answer = await task.prompt({
                type: 'Select',
                message: '请选择需要使用的构造器',
                choices: groups.map(item => item.label)
              });
              return groups.findIndex(group => group.label === answer);
            };

            try {
              const builder = await dockerpacks.detect(
                appRoot,
                promptIo,
                messageHandler,
                selectorFn
              );
              if (!builder) {
                messageHandler.pass(
                  'error',
                  '没有找到合适的构造器，当前项目的语言或框架可能暂未被我们支持'
                );
                messageHandler.pass('error', '您也可以检查指定的路径是否正确');
                throw new Error('分析失败');
              } else {
                messageHandler.pass('info', `即将使用 ${builder.group.label}`);
                ctx.builder = builder;
              }
            } catch (e) {
              throw serializeError(e);
            }
          },
          options: {
            persistentOutput: true,
            bottomBar: Infinity
          }
        },
        {
          title: '构建容器化文件',
          task: async (ctx, task) => {
            messageHandler.setOutput(task.stdout());
            promptIo.setPrompt(async (...args) => await task.prompt(...args));
            const builder: DockerpacksBuilder = ctx.builder;

            let result: DockerpacksBuildResult | null = null;
            try {
              result = await builder.build();
            } catch (e) {
              throw serializeError(e);
            }

            ctx.buildResult = result;
          },
          options: {
            persistentOutput: true,
            bottomBar: Infinity
          }
        },
        {
          title: '写入相关文件',
          task: async (ctx, task) => {
            messageHandler.setOutput(task.stdout());
            promptIo.setPrompt(async (...args) => await task.prompt(...args));

            const builder: DockerpacksBuilder = ctx.builder;

            try {
              const files = [...ctx.buildResult.files.entries()];
              await Promise.all([
                writeFileLogged(path.join(appRoot, 'Dockerfile'), ctx.buildResult.dockerfile),
                ...files.map(([relativePath, content]) =>
                  writeFileLogged(path.join(appRoot, relativePath), content)
                )
              ]);

              if (!existsSync(path.join(appRoot, 'wxcloud.config.js'))) {
                if (builder.group.type === 'node') {
                  await writeFileLogged(
                    path.join(appRoot, 'wxcloud.config.js'),
                    DEFAULT_CLOUD_CONFIG_JS_CONTENT
                  );
                } else {
                  await writeFileLogged(
                    path.join(appRoot, 'wxcloud.config.json'),
                    JSON.stringify(DEFAULT_CLOUD_CONFIG, null, 2)
                  );
                }
              }
            } catch (e) {
              throw serializeError(e);
            }
          },
          options: {
            persistentOutput: true,
            bottomBar: Infinity
          }
        }
      ],
      {
        concurrent: false,
        rendererOptions: {
          clearOutput: false,
          collapse: false,
          collapseErrors: false
        }
      }
    );

    await tasks.run();

    console.log('\n\n');
    ora().succeed('项目容器化成功，执行 `wxcloud deploy` 立即部署');
  }
}

class CliPromptIO extends PromptIO {
  private prompt: (option: PromptOptions) => Promise<any> = null!;

  setPrompt(prompt: (option: PromptOptions) => Promise<any>) {
    this.prompt = prompt;
  }

  async ok(id: string, caption: string): Promise<boolean> {
    return await this.prompt({
      type: 'Confirm',
      message: caption
    });
  }

  async input(id: string, caption: string): Promise<string> {
    return await this.prompt({
      type: 'Input',
      message: caption
    });
  }

  async select(id: string, caption: string, options: [string, ...string[]]): Promise<number> {
    return await this.prompt({
      type: 'Select',
      message: caption,
      choices: options
    });
  }
}

class CliMessageHandler implements MessageHandler {
  private output: NodeJS.WriteStream & NodeJS.WritableStream = null!;

  setOutput(output: NodeJS.WriteStream & NodeJS.WritableStream) {
    this.output = output;
  }

  pass(level: MessageLevel, message: string) {
    let output = '';
    switch (level) {
      case 'debug':
        output = wrapDebug(message);
        break;
      case 'warn':
        output = wrapWarn(message);
        break;
      case 'error':
        output = wrapError(message);
        break;
      case 'info':
      default:
        output = wrapInfo(message);
        break;
    }
    this.output.write(output);
  }
}
