import { Command, flags } from '@oclif/command';
import rimraf from 'rimraf';
import { CloudAPI, safeRequire } from '@wxcloud/core';
import * as CloudKit from '@wxcloud/cloudkit';
import { CloudConfig } from '@wxcloud/core';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { uploadVersionPackage } from '../../api/files';
import { readLoginState } from '../../utils/auth';
import { chooseEnvId, chooseServiceId } from '../../utils/ux';
import { beginUpload } from '../storage/upload';
import chalk from 'chalk';
import { execWithLoading } from '../../utils/loading';
import { getDeployResult } from '../../functions/getDeployResult';
import ora from 'ora';
import { logger } from '../../utils/log';
import inquirer from 'inquirer';

const oraStages: Record<string, ora.Ora> = {};
const stageName = {
  'runkit::pack': '打包云托管产物'
};

const { tcbDescribeCloudBaseBuildService, tcbDescribeWxCloudBaseRunEnvs, tcbSubmitServerRelease } =
  CloudAPI;

function extractCloudConfig(): CloudConfig {
  const cwd = process.cwd();
  const allowedPrefix = ['cjs', 'js', 'json'];
  let configFilePath = '';
  allowedPrefix.forEach(p => {
    const test = path.join(cwd, `wxcloud.config.${p}`);
    if (existsSync(test)) {
      configFilePath = test;
    }
  });
  if (configFilePath) {
    // todo: if we got a config file, we can just run RunKit as-is.
    // since Dockerfile is expected to be generated by Dockerpacks.
    const config = safeRequire(configFilePath);
    return config;
  }
  // no config file, should prompt user to run `wxcloud migrate` first.
  throw new Error('没有配置文件，请先执行 `wxcloud migrate` 将项目迁移到云托管');
}
export default class DeployCommand extends Command {
  static description = '部署项目';

  static examples = [`wxcloud deploy`];

  static flags = {
    envId: flags.string({ char: 'e', description: '环境ID' }),
    serviceName: flags.string({ char: 's', description: '服务名' }),
    port: flags.integer({ char: 'p', default: 80, description: '端口号' }),
    dryRun: flags.boolean({ default: false, description: '不执行实际部署指令' })
  };

  async run() {
    const { flags } = this.parse(DeployCommand);

    const cloudConfig = extractCloudConfig();
    const isStatic = cloudConfig.type === 'static';
    const envId = flags.envId || (await chooseEnvId());
    const serviceName = flags.serviceName || isStatic ? undefined : await chooseServiceId(envId);
    const env = await tcbDescribeWxCloudBaseRunEnvs({});
    const target = env.envList.find(env => env.envId === envId);
    if (!target) {
      throw new Error(`环境 ${envId} 不存在`);
    }
    let staticDomain: string | undefined;
    if (cloudConfig.type === 'universal' || cloudConfig.type === 'static') {
      if (target.staticStorages[0]?.staticDomain) {
        const domainWithoutPrefix = target.staticStorages[0]?.staticDomain;
        console.log(chalk.green.bold('静态资源'), domainWithoutPrefix);
        // check is cors enabled in static storage
        const tcbAttr = await CloudAPI.cdnTcbCheckResource({
          domains: [domainWithoutPrefix]
        });
        logger.debug(tcbAttr);
        if (tcbAttr.domains[0].domainConfig.rspHeader?.switch !== 'on') {
          const answer = (
            await inquirer.prompt([
              {
                type: 'confirm',
                name: 'answer',
                message: '检测到静态资源未开启跨域访问，是否开启？'
              }
            ])
          ).answer;
          if (answer) {
            await CloudAPI.cdnTcbModifyAttribute({
              domain: tcbAttr.domains[0].domain,
              domainId: tcbAttr.domains[0].domainId,
              domainConfig: {
                rspHeader: {
                  switch: 'on',
                  headerRules: [
                    {
                      headerName: 'Access-Control-Allow-Origin',
                      headerValue: ['*']
                    }
                  ]
                }
              }
            });
          }
        }
        staticDomain = `https://${domainWithoutPrefix}`;
      } else {
        throw new Error('该环境尚未开通静态资源能力，请到控制台开通后再试');
      }
    }

    const res = await CloudKit.execAllKits({
      fullPath: process.cwd(),
      config: cloudConfig,
      staticDomain,
      lifecycleHooks: {
        enterStage(stage) {
          oraStages[stage] = ora(stageName[stage]).start();
        },
        leaveStage(stage) {
          oraStages[stage].succeed();
        }
      }
    });
    logger.debug(chalk.yellow.bold('CloudKit'), res);
    if (res.runTarget && !flags.dryRun) {
      const { uploadUrl, packageName, packageVersion } = await tcbDescribeCloudBaseBuildService({
        envId,
        serviceName: serviceName
      });
      await execWithLoading(() => uploadVersionPackage(uploadUrl, readFileSync(res.runTarget!)), {
        startTip: '云托管产物上传中...',
        successTip: '云托管产物上传成功'
      });
      if (!process.env.KEEP_DEPLOY_TARGET) {
        rimraf.sync(res.runTarget);
      }
      const userConfig =
        typeof cloudConfig.server === 'string'
          ? {
              buildDir: cloudConfig.server
            }
          : cloudConfig.server;
      await tcbSubmitServerRelease({
        deployType: 'package',
        envId,
        hasDockerfile: true,
        releaseType: 'FULL',
        serverName: serviceName,
        dockerfile: 'Dockerfile',
        wxAppId: (await readLoginState()).appid,
        packageName,
        packageVersion,
        port: flags.port,
        versionRemark: 'cloudkit',
        ...userConfig
      });
      console.log(chalk.green('云托管'), '版本创建成功');
    }
    if (res.staticTarget && !flags.dryRun) {
      console.log(chalk.green('静态资源'), '准备上传中');
      for (const [local, remote] of Object.entries(res.staticTarget)) {
        await beginUpload(local, target.staticStorages[0], remote, 5);
      }
    }
    if (flags.dryRun) {
      return;
    }
    switch (cloudConfig.type) {
      case 'universal':
      case 'run':
        await getDeployResult({
          envId,
          isPrintLog: true,
          log: console.log,
          serviceName
        });
        // 部署完成，展示域名
        const domain = await CloudAPI.tcbDescribeCloudBaseRunServiceDomain({
          envId,
          serviceName
        });
        console.log('\n\n');
        ora().succeed(`部署完成
  服务 ${serviceName} 访问地址: 
  > ${domain.defaultPublicDomain} `);
        break;
      case 'static':
        ora().succeed(`静态资源部署完成 \n\n 访问地址：${staticDomain}`);
        break;
    }
  }
}
