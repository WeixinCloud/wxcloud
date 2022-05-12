import path from "path";
import * as inquirer from "inquirer";
import { writeFile } from "fs/promises";
import {
  DockerpacksRunner,
  MessageHandler,
  PromptIO,
  MessageLevel,
  BuildResult,
} from "@wxcloud/dockerpacks";
import { Command, flags } from "@oclif/command";
import { existsSync } from "fs";
import { Listr, PromptOptions } from "listr2";
import { isDirectoryEmpty, isDirectoryExists } from "../../utils/file";
import { serializeError } from "../../utils/errors";
import { wrapDebug, wrapError, wrapInfo, wrapWarn } from "../../utils/colors";

export class DockerizeCommand extends Command {
  static description = "容器化项目";
  static examples = [`wxcloud dockerize <项目根目录>`];

  static args = [{ name: "path", description: "项目根目录", default: "." }];
  static flags = {
    help: flags.help({ char: "h", description: "查看帮助信息" }),
  };

  async run() {
    const { args } = this.parse(DockerizeCommand);
    const appRoot = path.resolve(args.path);

    if (!isDirectoryExists(appRoot)) {
      this.error("指定的文件夹不存在");
    }
    if (isDirectoryEmpty(appRoot)) {
      this.error("指定的文件夹为空");
    }

    if (existsSync(path.join(appRoot, "Dockerfile"))) {
      const answer = (
        await inquirer.prompt([
          {
            type: "confirm",
            name: "answer",
            message: "指定的文件夹已经存在 Dockerfile，是否删除并继续",
          },
        ])
      ).answer;
      if (!answer) {
        return;
      }
    }

    const runner = new DockerpacksRunner();
    const messageHandler = new CliMessageHandler();
    const promptIo = new CliPromptIO();

    const tasks = new Listr(
      [
        {
          title: "构建 Dockerfile",
          skip: (ctx) => ctx.skip,
          task: async (ctx, task) => {
            messageHandler.setOutput(task.stdout());
            promptIo.setPrompt(async (...args) => await task.prompt(...args));

            let result: BuildResult | null = null;
            try {
              result = await runner.run(appRoot, promptIo, messageHandler);
            } catch (e) {
              throw serializeError(e);
            }

            if (!result) {
              messageHandler.pass("暂不支持此项目", "fatal");
              ctx.skip = true;
              return;
            }

            ctx.buildResult = result;
          },
          options: {
            persistentOutput: true,
            bottomBar: Infinity,
          },
        },
        {
          title: "写入文件",
          skip: (ctx) => ctx.skip,
          task: async (ctx, task) => {
            messageHandler.setOutput(task.stdout());
            promptIo.setPrompt(async (...args) => await task.prompt(...args));

            try {
              const writeFileLogged = async (
                fullPath: string,
                content: string
              ) => {
                await writeFile(fullPath, content);
                messageHandler.pass(`写入 ${fullPath}`);
              };

              const files = [...ctx.buildResult.files.entries()];
              await Promise.all([
                writeFileLogged(
                  path.join(appRoot, "Dockerfile"),
                  ctx.buildResult.dockerfile
                ),
                ...files.map(([relativePath, content]) =>
                  writeFileLogged(path.join(appRoot, relativePath), content)
                ),
              ]);
            } catch (e) {
              throw serializeError(e);
            }
          },
          options: {
            persistentOutput: true,
            bottomBar: Infinity,
          },
        },
      ],
      {
        concurrent: false,
        rendererOptions: {
          clearOutput: false,
          collapse: false,
          collapseErrors: false,
        },
      }
    );

    await tasks.run();
  }
}

class CliPromptIO implements PromptIO {
  private prompt: (option: PromptOptions) => Promise<any> = null!;

  setPrompt(prompt: (option: PromptOptions) => Promise<any>) {
    this.prompt = prompt;
  }

  async ok(id: string, caption: string): Promise<boolean> {
    return await this.prompt({
      type: "confirm",
      name: "answer",
      message: caption,
    });
  }

  async input(id: string, caption: string): Promise<string> {
    return await this.prompt({
      type: "input",
      name: "answer",
      message: caption,
    });
  }

  async select(
    id: string,
    caption: string,
    options: [string, ...string[]]
  ): Promise<number> {
    return await this.prompt({
      message: caption,
      type: "list",
      choices: [options.map((item) => ({ name: item }))],
    });
  }
}

class CliMessageHandler implements MessageHandler {
  private output: NodeJS.WriteStream & NodeJS.WritableStream = null!;

  setOutput(output: NodeJS.WriteStream & NodeJS.WritableStream) {
    this.output = output;
  }

  pass(message: string, level?: MessageLevel) {
    let output = "";
    switch (level) {
      case "debug":
        output = wrapDebug(message);
        break;
      case "warn":
        output = wrapWarn(message);
        break;
      case "fatal":
        output = wrapError(message);
        break;
      case "info":
      default:
        output = wrapInfo(message);
        break;
    }
    this.output.write(output);
  }
}
