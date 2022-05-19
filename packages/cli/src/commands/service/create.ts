import { Command, flags } from '@oclif/command';
import { cli } from 'cli-ux';
import { EstablishCloudBaseRunServerWx } from '../../api';
import { ApiRegion, setApiCommonParameters } from '../../api/common';
import { execWithLoading } from '../../utils/loading';
import { chooseEnvId } from '../../utils/ux';
import { REGION_COMMAND_FLAG } from '../../utils/flags';

export default class CreateServiceCommand extends Command {
  static description = '创建服务';

  static examples = ['wxcloud service:create'];

  static flags = {
    help: flags.help({ char: 'h', description: '查看帮助' }),
    region: REGION_COMMAND_FLAG,
    envId: flags.string({ char: 'e', description: '环境ID' }),
    serviceName: flags.string({ char: 's', description: '服务名称' }),
    isPublic: flags.boolean({
      description: '是否开通外网访问',
      default: false
    }),
    json: flags.boolean({
      description: '是否以json格式展示结果',
      default: false
    })
  };

  async run() {
    const { flags } = this.parse(CreateServiceCommand);
    setApiCommonParameters({ region: flags.region as ApiRegion });
    const envId = flags.envId || (await chooseEnvId());
    const serviceName = flags.serviceName || (await cli.prompt('请输入服务名称'));
    const valiateServiceNameMessage = valiateServiceName(serviceName);
    if (valiateServiceNameMessage) {
      this.error(valiateServiceNameMessage);
    }
    await execWithLoading(
      () =>
        EstablishCloudBaseRunServerWx({
          EnvId: envId,
          ServiceName: serviceName,
          IsPublic: true,
          OpenAccessTypes: flags.isPublic ? ['MINIAPP', 'PUBLIC'] : ['MINIAPP']
        }),
      {
        startTip: '创建服务中...',
        successTip: '服务创建成功',
        failTip: '服务创建失败，请重试！'
      }
    );
    if (flags.json) {
      this.log(JSON.stringify({ code: 0, errmsg: 'success', data: null }));
    }
  }
}

/**
 * 校验服务名称是否非法，非法时返回报错信息
 */
export function valiateServiceName(serviceName: string, serviceNameList?: string[]): string {
  let message;
  if (
    serviceName.length === 0 ||
    serviceName.length > 20 ||
    !/^[a-z]+/.test(serviceName) ||
    !/^[a-z0-9-]+$/.test(serviceName)
  ) {
    message = '服务名称只能包含数字、小写字母和-，只能以小写字母开头，最多20字符';
  }
  if (serviceNameList?.length && serviceNameList.includes(serviceName)) {
    message = '输入的服务名已存在';
  }
  return message;
}
