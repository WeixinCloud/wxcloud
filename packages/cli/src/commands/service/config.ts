import { Command, flags } from '@oclif/command';
import { cli } from 'cli-ux';
import { ApiRegion, setApiCommonParameters } from '../../api/common';
import { execWithLoading } from '../../utils/loading';
import { chooseEnvId, chooseServiceId } from '../../utils/ux';
import { REGION_COMMAND_FLAG } from '../../utils/flags';
import { CloudAPI, preprocessBaseConfig } from '@wxcloud/core';
import { Flags } from '@oclif/core';
import { readLoginState } from '../../utils/auth';
import { merge } from 'lodash';
import { parseEnvParams } from '../../utils/envParams';

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
  static args = [{ name: 'action', description: '操作模式，默认为 read，更新配置为 update', default: 'read' }];

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
    cpuThreshold: flags.integer({
      description: 'CPU 使用率调度策略阈值'
    }),
    memThreshold: flags.integer({
      description: '内存使用率调度策略阈值'
    }),
    envParams: flags.string({
      char: 'p',
      description: '环境变量，格式aa=bb&cc=dd'
    }),
    envParamsJson: flags.string({
      description: '服务环境变量，在此版本开始生效，同步到服务设置，格式为json，默认为空'
    }),
    customLogs: flags.string({
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

    const config: Record<string, any> = {};
    const policyDetails: Record<string, string | number>[] = [];

    if (flags.cpuThreshold) {
      if (flags.cpuThreshold < 0 || flags.cpuThreshold > 100) {
        this.error('CPU 使用率调度策略阈值只能介于 0 到 100 之间');
      }
      policyDetails.push({
        policyType: 'cpu',
        policyThreshold: flags.cpuThreshold
      });
    }

    if (flags.memThreshold) {
      if (flags.memThreshold < 0 || flags.memThreshold > 100) {
        this.error('内存使用率调度策略阈值只能介于 0 到 100 之间');
      }
      policyDetails.push({
        policyType: 'mem',
        policyThreshold: flags.memThreshold
      });
    }

    if (flags.cpuThreshold || flags.memThreshold) {
      Object.assign(config, {
        // 这两个旧属性是后端必须的，即使没有实质作用
        policyType: '',
        policyThreshold: 0,
        policyDetails
      });
    }

    // merge old config with new config
    // remove undefined
    ['cpu', 'mem', 'minNum', 'maxNum', 'envParams', 'customLogs'].forEach(key => {
      if (flags[key] !== undefined) {
        config[key] = flags[key];
        if (key === 'envParams') {
          const mergedEnvParams = merge(parseEnvParams(flags.envParams), JSON.parse(flags.envParamsJson || '{}'));
          config[key] = JSON.stringify(mergedEnvParams);
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
          ...preprocessBaseConfig(oldConfig),
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
