import * as fs from "fs";
import * as path from "path";
import * as inquirer from "inquirer";
import simpleGit from "simple-git";
import listr from "listr";
import { Command, flags } from "@oclif/command";

interface Template {
  name: string;
  displayName: string;
  url: string;
  repository: string;
  initCommands?: string[];
}

const TEMPLATES: Template[] = [
  {
    name: "wxcloudrun-springboot",
    displayName: "SprintBoot 模板",
    url: "https://github.com/WeixinCloud/wxcloudrun-springboot",
    repository: "https://github.com/WeixinCloud/wxcloudrun-springboot.git",
  },
  {
    name: "wxcloudrun-express",
    displayName: "Express 模板",
    url: "https://github.com/WeixinCloud/wxcloudrun-express",
    repository: "https://github.com/WeixinCloud/wxcloudrun-express.git",
  },
];

export class InitCommand extends Command {
  static description = "初始化项目目录";
  static examples = [`wxcloud init <项目根目录>`];
  static args = [{ name: "path", description: "项目根目录", default: "." }];
  static flags = {
    help: flags.help({ char: "h", description: "查看帮助信息" }),
    template: flags.enum({
      char: "s",
      description: "使用的模板名称",
      options: TEMPLATES.map((item) => item.name),
    }),
  };

  async run() {
    const { args, flags } = this.parse(InitCommand);
    await this.checkTargetPath(args.path);
    if (!flags.template) {
      flags.template = await this.promptTemplate();
    }
    const targetPath = args.path;
    const template = TEMPLATES.find((t) => t.name === flags.template)!;

    // TODO: check git

    const tasks = new listr([
      {
        title: "克隆模板文件",
        task: async () => {
          await simpleGit().clone(template.repository, targetPath);
        },
      },
      {
        title: "初始化 Git 仓库",
        task: async () => {
          await fs.promises.rm(path.join(targetPath, ".git"), {
            recursive: true,
            force: true,
          });
          await simpleGit(targetPath).init();
        },
      },
      // TODO: run initCommands if any
    ]);

    await tasks.run();
  }

  private async checkTargetPath(path: string) {
    let stat;
    try {
      stat = await fs.promises.lstat(path);
    } catch {
      return;
    }
    if (stat && !stat.isDirectory()) {
      this.error("请指定一个文件夹作为路径");
    }

    const files = await fs.promises.readdir(path);
    if (files.length > 0) {
      this.error("目标文件夹已经含有文件");
    }
  }

  private async promptTemplate() {
    const choices = TEMPLATES.map((template) => ({
      name: `${template.displayName} (${template.url})`,
      value: template.name,
    }));
    const response = await inquirer.prompt([
      {
        name: "template",
        message: "选择模板",
        type: "list",
        choices,
      },
    ]);
    return response.template;
  }
}
