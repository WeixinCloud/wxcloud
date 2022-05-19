import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from 'inquirer';
import degit from 'degit';
import { Listr } from 'listr2';
import { Command, flags } from '@oclif/command';
import { isDirectoryEmpty, isDirectoryExists } from '../../utils/file';
import { writeFileLogged } from '../../functions/writeFileLogged';
import { DEFAULT_CLOUD_CONFIG } from '@wxcloud/core';

interface Template {
  name: string;
  displayName: string;
  url: string;
  repository: string;
  initCommands?: string[];
}

const TEMPLATES: Template[] = [
  {
    name: 'wxcloudrun-springboot',
    displayName: 'Spring Boot 模板',
    url: 'https://github.com/WeixinCloud/wxcloudrun-springboot',
    repository: 'https://github.com/WeixinCloud/wxcloudrun-springboot.git'
  },
  {
    name: 'wxcloudrun-express',
    displayName: 'Express 模板',
    url: 'https://github.com/WeixinCloud/wxcloudrun-express',
    repository: 'https://github.com/WeixinCloud/wxcloudrun-express.git'
  },
  {
    name: 'wxcloudrun-django',
    displayName: 'Django 模板',
    url: 'https://github.com/WeixinCloud/wxcloudrun-django',
    repository: 'https://github.com/WeixinCloud/wxcloudrun-django.git'
  },
  {
    name: 'wxcloudrun-thinkphp-nginx',
    displayName: 'ThinkPHP (Nginx) 模板',
    url: 'https://github.com/WeixinCloud/wxcloudrun-thinkphp-nginx',
    repository: 'https://github.com/WeixinCloud/wxcloudrun-thinkphp-nginx.git'
  },
  {
    name: 'wxcloudrun-express',
    displayName: 'Express 模板',
    url: 'https://github.com/WeixinCloud/wxcloudrun-express',
    repository: 'https://github.com/WeixinCloud/wxcloudrun-express.git'
  },
  {
    name: 'wxcloudrun-golang',
    displayName: 'Golang 模板',
    url: 'https://github.com/WeixinCloud/wxcloudrun-golang',
    repository: 'https://github.com/WeixinCloud/wxcloudrun-golang.git'
  },
  {
    name: 'wxcloudrun-laravel',
    displayName: 'Laravel 模板',
    url: 'https://github.com/WeixinCloud/wxcloudrun-laravel',
    repository: 'https://github.com/WeixinCloud/wxcloudrun-laravel.git'
  },
  {
    name: 'wxcloudrun-dotnet',
    displayName: '.NET Core 模板',
    url: 'https://github.com/WeixinCloud/wxcloudrun-dotnet',
    repository: 'https://github.com/WeixinCloud/wxcloudrun-dotnet.git'
  },
  {
    name: 'wxcloudrun-thinkphp-apache',
    displayName: 'ThinkPHP (Apache) 模板',
    url: 'https://github.com/WeixinCloud/wxcloudrun-thinkphp-apache',
    repository: 'https://github.com/WeixinCloud/wxcloudrun-thinkphp-apache.git'
  },
  {
    name: 'wxcloudrun-flask',
    displayName: 'Flask 模板',
    url: 'https://github.com/WeixinCloud/wxcloudrun-flask',
    repository: 'https://github.com/WeixinCloud/wxcloudrun-flask.git'
  },
  {
    name: 'wxcloudrun-koa',
    displayName: 'Koa 模板',
    url: 'https://github.com/WeixinCloud/wxcloudrun-koa',
    repository: 'https://github.com/WeixinCloud/wxcloudrun-koa.git'
  }
];

export class InitCommand extends Command {
  static description = '初始化项目目录';
  static examples = [`wxcloud init <项目根目录>`];
  static args = [{ name: 'path', description: '项目根目录', default: '.' }];
  static flags = {
    help: flags.help({ char: 'h', description: '查看帮助信息' }),
    template: flags.enum({
      char: 's',
      description: '使用的模板名称',
      options: TEMPLATES.map(item => item.name)
    })
  };

  async run() {
    const { args, flags } = this.parse(InitCommand);
    this.checkTargetPath(args.path);
    if (!flags.template) {
      flags.template = await this.promptTemplate();
    }
    const targetPath = args.path;
    const template = TEMPLATES.find(t => t.name === flags.template)!;
    const tasks = new Listr([
      {
        title: '克隆模板文件',
        task: () => {
          const emitter = degit(template.repository);
          return emitter.clone(targetPath);
        }
      },
      {
        title: '初始化项目',
        task: async () => {
          await writeFileLogged(
            path.join(targetPath, 'wxcloud.config.json'),
            JSON.stringify(DEFAULT_CLOUD_CONFIG, null, 2)
          );
        }
      }
    ]);

    await tasks.run();
  }

  private checkTargetPath(path: string) {
    if (!isDirectoryExists(path)) {
      this.error('请指定一个文件夹作为路径');
    }
    if (!isDirectoryEmpty(path)) {
      this.error('目标文件夹已经含有文件');
    }
  }

  private async promptTemplate() {
    const choices = TEMPLATES.map(template => ({
      name: `${template.displayName} (${template.url})`,
      value: template.name
    }));
    const response = await inquirer.prompt([
      {
        name: 'template',
        message: '选择模板',
        type: 'list',
        choices
      }
    ]);
    return response.template;
  }
}
