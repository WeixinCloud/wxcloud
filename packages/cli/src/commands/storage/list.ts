import Command, { flags } from '@oclif/command';
import { CloudAPI } from '@wxcloud/core';
import { promises } from 'fs';
import COS from 'cos-nodejs-sdk-v5';
import { REGION_COMMAND_FLAG } from '../../utils/flags';
import { ApiRegion, setApiCommonParameters } from '../../api/common';
import ora from 'ora';
import { logger } from '../../utils/log';
import { IGenericStorage, getAuthorizationThunk } from '../../utils/storage';

const { tcbGetEnvironments, tcbDescribeWxCloudBaseRunEnvs } = CloudAPI;
export default class ListObjectsCommand extends Command {
  static description = '查询文件列表';

  static examples = [`wxcloud storage:list <路径前缀>`];
  static args = [{ name: 'prefix', description: '路径前缀' }];
  static flags = {
    help: flags.help({ char: 'h', description: '查看帮助信息' }),
    region: REGION_COMMAND_FLAG,
    envId: flags.string({ char: 'e', description: '环境ID' }),
    marker: flags.string({
      description: '起始对象键标记，列出从 Marker 开始 MaxKeys 条目，默认顺序为 UTF-8 字典序'
    }),
    'max-keys': flags.integer({
      description: '单次返回最大的条目数量，默认1000，最大为1000'
    }),
    delimiter: flags.string({
      char: 'd',
      description:
        '定界符。为一个分隔符号，用于对对象键进行分组。一般是传/。所有对象键从 Prefix 或从头（如未指定 Prefix）到首个 delimiter 之间相同部分的路径归为一类，定义为 Common Prefix，然后列出所有 Common Prefix'
    }),
    json: flags.boolean({
      char: 'j',
      description: '以 json 格式输出完整信息。否则仅列出文件 keys'
    }),
    mode: flags.enum({
      char: 'm',
      options: ['staticstorage', 'storage'],
      description: '存储类型，storage 为对象存储，staticstorage 为静态资源存储，不指定则为对象存储'
    })
  };

  async run() {
    const { args, flags } = this.parse(ListObjectsCommand);
    setApiCommonParameters({ region: flags.region as ApiRegion });
    const { mode = 'storage', marker, delimiter, json } = flags;
    const envId = flags.envId;
    const maxKeys = flags['max-keys'];
    console.log(`即将执行查询...`);
    const envRes = await Promise.all([
      tcbGetEnvironments({}),
      tcbDescribeWxCloudBaseRunEnvs({ allRegions: true })
    ]);
    const envList = [...envRes[0].envList, ...envRes[1].envList];
    const currentEnv = envList.find(env => env.envId === envId);
    if (!currentEnv) {
      throw new Error(`环境 ${envId} 不存在`);
    }

    let storage;
    if (mode === 'staticstorage') {
      storage = currentEnv.staticStorages?.[0];
      // check status
      if (!storage || storage.status !== 'online') {
        throw new Error(`存储状态异常 ${storage.status}`);
      }
    } else if (mode === 'storage') {
      storage = currentEnv.storages?.[0];
      if (!storage) {
        throw new Error(`存储状态异常 ${storage}`);
      }
    }
    return listObjects({
      storage,
      prefix: args.prefix || '',
      marker,
      maxKeys,
      delimiter,
      json
    });
  }
}

export async function listObjects(options: IListObjectsOptions) {
  const cos = new COS({
    getAuthorization: await getAuthorizationThunk(options.storage)
  });

  try {
    const spinner = ora(`正在查询文件列表...`).start();
    const result = await cos.getBucket({
      Bucket: options.storage.bucket,
      Region: options.storage.region,
      Prefix: options.prefix,
      Marker: options.marker,
      MaxKeys: options.maxKeys,
      Delimiter: options.delimiter
    });
    spinner.stop();
    spinner.succeed(`查询成功`);
    if (options.json) {
      console.log(JSON.stringify(result));
    } else {
      console.log(result.Contents?.map(item => item.Key).join('\n'));
    }
    logger.debug(result);
    return result;
  } catch (err) {
    throw new Error(`查询失败: ${err.message}`);
  }
}

interface IListObjectsOptions {
  storage: IGenericStorage;
  prefix: string;
  marker?: string;
  maxKeys?: number;
  delimiter?: string;
  json?: boolean;
}
