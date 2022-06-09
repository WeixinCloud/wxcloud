import { Command, flags } from '@oclif/command';
import { cli } from 'cli-ux';
import { EstablishCloudBaseRunServerWx } from '../../api';
import { ApiRegion, setApiCommonParameters } from '../../api/common';
import { execWithLoading } from '../../utils/loading';
import { chooseEnvId, chooseServiceId } from '../../utils/ux';
import { REGION_COMMAND_FLAG } from '../../utils/flags';
import { CloudAPI } from '@wxcloud/core';
import { Flags } from '@oclif/core';
import { readLoginState } from '../../utils/auth';
// @ts-ignore
export const number = Flags.build({
  // @ts-ignore
  parse: (input, ctx) => {
    return +input;
  }
});

export default class ConfigServiceCommand extends Command {
  static description = '配置服务';

  static examples = ['wxcloud service:config <action> [options]'];
  static args = [{ name: 'action', description: '操作模式', default: 'read' }];

  static flags = {
    help: flags.help({ char: 'h', description: '查看帮助' }),
    region: REGION_COMMAND_FLAG,
    envId: flags.string({ char: 'e', description: '环境ID' }),
    serviceName: flags.string({ char: 's', description: '服务名称' }),
    noConfirm: flags.boolean({
      description: '更新配置时跳过二次确认',
      default: false
    }),
    cpu: number({
      char: 'c',
      description: 'CPU'
    }),
    mem: number({
      char: 'm',
      description: '内存'
    }),
    minNum: flags.integer({
      char: 'n',
      description: '最小实例数'
    }),
    maxNum: flags.integer({
      char: 'x',
      description: '最大实例数'
    }),
    policyType: flags.enum({
      options: ['cpu', 'mem'],
      description: '调度策略类型'
    }),
    policyThreshold: flags.integer({
      char: 't',
      description: '调度策略阈值'
    }),
    envParams: flags.string({
      char: 'p',
      description: '环境变量，格式aa=bb&cc=dd'
    }),
    customLog: flags.string({
      char: 'l',
      description: '自定义日志采集路径'
    })
  };

  async run() {
    const { flags, args } = this.parse(ConfigServiceCommand);
    setApiCommonParameters({ region: flags.region as ApiRegion });
    const envId = flags.envId || (await chooseEnvId());
    const serviceName = flags.serviceName || (await chooseServiceId(envId));
    // pull last config
    const { serviceBaseConfig: oldConfig } = await CloudAPI.tcbDescribeServiceBaseConfig({
      envId,
      serverName: serviceName
    });
    // merge old config with new config
    // remove undefined
    const config: Record<string, any> = {};
    [
      'cpu',
      'mem',
      'minNum',
      'maxNum',
      'policyType',
      'policyThreshold',
      'envParams',
      'customLog'
    ].forEach(key => {
      if (flags[key] !== undefined) {
        config[key] = flags[key];
        if (key === 'envParams') {
          config[key] = JSON.stringify(
            flags[key]!.split('&').reduce((prev, cur) => {
              prev[cur.split('=')[0]] = cur.split('=')[1];
              return prev;
            }, {})
          );
        }
      }
    });
    const { action } = args;

    switch (action) {
      case 'read':
        cli.info(JSON.stringify(oldConfig, null, 2));
        break;
      case 'update':
        const conf = {
          ...oldConfig,
          ...config
        };
        cli.info(JSON.stringify(conf, null, 2));
        const confirmed = flags.noConfirm || (await cli.confirm('确认要更新吗？'));
        if (!confirmed) {
          return;
        }
        await execWithLoading(
          async () => {
            await CloudAPI.tcbSubmitServerConfigChange({
              envId,
              serverName: serviceName,
              conf,
              wxAppId: (await readLoginState()).appid
            });
          },
          {
            startTip: '提交配置变更中...',
            successTip: '提交配置变更成功'
          }
        );
        break;
    }
  }
}
