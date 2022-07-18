import Command, { flags } from '@oclif/command';
import { CloudAPI } from '@wxcloud/core';
import { REGION_COMMAND_FLAG } from '../../utils/flags';
import { ApiRegion, setApiCommonParameters } from '../../api/common';
import ora from 'ora';
import { logger } from '../../utils/log';
import { chooseEnvId } from '../../utils/ux';

const { tcbGetEnvironments, tcbDescribeWxCloudBaseRunEnvs } = CloudAPI;
export default class PurgeStorageCommand extends Command {
  static description = '刷新静态存储缓存';

  static examples = [`wxcloud storage:purge`];
  static flags = {
    help: flags.help({ char: 'h', description: '查看帮助信息' }),
    region: REGION_COMMAND_FLAG,
    envId: flags.string({ char: 'e', description: '环境ID' })
  };

  async run() {
    const { args, flags } = this.parse(PurgeStorageCommand);
    setApiCommonParameters({ region: flags.region as ApiRegion });
    const envId = flags.envId || (await chooseEnvId());
    console.log(`即将刷新环境 ${envId} 的静态存储缓存`);
    const envRes = await Promise.all([
      tcbGetEnvironments({}),
      tcbDescribeWxCloudBaseRunEnvs({ allRegions: true })
    ]);
    const envList = [...envRes[0].envList, ...envRes[1].envList];
    const currentEnv = envList.find(env => env.envId === envId);
    if (!currentEnv) {
      throw new Error(`环境 ${envId} 不存在`);
    }
    // pick urls
    const url = currentEnv.staticStorages?.[0]?.staticDomain;
    console.log(url);
    if (!url) {
      throw new Error(`环境 ${envId} 没有开通静态存储`);
    }
    // do purge
    const spinner = ora(`正在刷新环境 ${envId} 的静态存储缓存`).start();
    const result = await CloudAPI.cdnTcbPurge({
      urls: [`https://${url}`]
    });
    logger.debug(result);
    spinner.stop();
    spinner.succeed(`刷新环境 ${envId} 的静态存储缓存成功`);
  }
}
