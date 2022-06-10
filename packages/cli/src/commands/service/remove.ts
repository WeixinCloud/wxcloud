import ora from 'ora';
import { ApiRegion, setApiCommonParameters } from '../../api/common';
import { bold, red } from 'kolorist';
import { chooseEnvId } from '../../utils/ux';
import { cli } from 'cli-ux';
import { CloudAPI } from '@wxcloud/core';
import { Command, flags } from '@oclif/command';
import { delay } from '../../utils/common';
import { readLoginState } from '../../utils/auth';
import { REGION_COMMAND_FLAG } from '../../utils/flags';

export default class RemoveServiceCommand extends Command {
  static description = '删除服务';

  static examples = ['wxcloud service:remove'];

  static flags = {
    help: flags.help({ char: 'h', description: '查看帮助' }),
    region: REGION_COMMAND_FLAG,
    envId: flags.string({ char: 'e', description: '环境ID' }),
    serviceName: flags.string({ char: 's', description: '服务名称' }),
    noConfirm: flags.boolean({ description: '跳过删除确认' })
  };

  async run() {
    const { appid: appId } = await readLoginState();

    const { flags } = this.parse(RemoveServiceCommand);
    setApiCommonParameters({ region: flags.region as ApiRegion });

    const envId = flags.envId || (await chooseEnvId());
    const serviceName = flags.serviceName || (await cli.prompt('请输入服务名称'));

    let spinner = ora('获取服务信息').start();
    const { versionsCount, pipelinesCount, imagesCount } = await this.fetchServiceStats(
      envId,
      serviceName,
      spinner
    );
    spinner.succeed();

    this.log(
      `\n此操作是${red(
        bold('不可撤销')
      )}的\n\n确认删除服务 ${serviceName} 吗？这将会永久删除此服务下的所有部署记录、流水线和镜像信息\n\n版本数量：${
        versionsCount ?? '未知'
      }\n镜像数量：${pipelinesCount}\n流水线：${imagesCount}\n\n`
    );

    const confirm = flags.noConfirm || (await cli.confirm('确认删除吗？(y/n)'));

    if (!confirm) {
      this.log('操作已取消');
      return;
    }

    spinner = ora('删除服务').start();
    await this.removeService(appId, envId, serviceName, spinner);
    spinner.succeed();
  }

  private async fetchServiceStats(envId: string, serviceName: string, spinner: ora.Ora) {
    try {
      const { versionItems } = await CloudAPI.tcbDescribeCloudBaseRunServer({
        envId,
        serverName: serviceName,
        limit: 100,
        offset: 0
      });
      const { pipelines } = await CloudAPI.tcbDescribeWxCloudBaseRunPipelines({
        envId,
        serviceId: serviceName
      });
      const { totalCount } = await CloudAPI.tcbDescribeCloudBaseRunImages({
        envId,
        serviceName
      });
      return {
        versionsCount: versionItems?.length,
        pipelinesCount: pipelines.length,
        imagesCount: totalCount
      };
    } catch (e) {
      spinner.fail();
      return this.error(e.message);
    }
  }

  private async removeService(appId: string, envId: string, serviceName: string, spinner: ora.Ora) {
    try {
      await this.doRemoveService(appId, envId, serviceName);
    } catch (e) {
      spinner.fail();
      return this.error(e.message);
    }
  }

  private async doRemoveService(appId: string, envId: string, serviceName: string) {
    await CloudAPI.tcbDeleteWxCloudBaseRunServer({
      wxAppid: appId,
      envId,
      serverName: serviceName
    });

    let pollTimes = 10;
    while (true) {
      if (pollTimes-- <= 0) {
        throw new Error('删除服务异常：超过最大重试次数，请提交工单处理');
      }

      const { cloudBaseRunServerSet } = await CloudAPI.tcbDescribeCloudBaseRunServers({
        envId,
        limit: 100,
        offset: 0
      });
      const completed =
        !!cloudBaseRunServerSet &&
        !cloudBaseRunServerSet.find(item => item.serverName === serviceName);
      if (completed) {
        break;
      }

      await delay(5000);
    }
  }
}
