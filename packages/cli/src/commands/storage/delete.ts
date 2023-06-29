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
export default class DeleteObjectsCommand extends Command {
  static description = '删除文件';

  static examples = [
    `wxcloud storage:delete -o <文件1> -o <文件2>`,
    `wxcloud storage:delete -p <路径前缀>`
  ];
  static flags = {
    help: flags.help({ char: 'h', description: '查看帮助信息' }),
    region: REGION_COMMAND_FLAG,
    envId: flags.string({ char: 'e', description: '环境ID' }),
    object: flags.string({ char: 'o', description: '文件路径', multiple: true }),
    prefix: flags.string({
      char: 'p',
      description: '路径前缀。删除文件夹时可以用路径前缀的方式'
    }),
    mode: flags.enum({
      char: 'm',
      options: ['staticstorage', 'storage'],
      description: '存储类型，storage 为对象存储，staticstorage 为静态资源存储，不指定则为对象存储'
    })
  };

  async run() {
    const { args, flags } = this.parse(DeleteObjectsCommand);
    setApiCommonParameters({ region: flags.region as ApiRegion });
    const { mode = 'storage', prefix, envId } = flags;
    let objects = flags.object;
    if (!objects || objects.length === 0) {
      if (!prefix) {
        throw new Error(`请指定要删除的文件或路径前缀`);
      }
    }
    console.log(`即将执行删除...`);
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
    await deleteObjects({
      storage,
      objects,
      prefix
    });
  }
}

async function deleteObjects(options: IDeleteObjectsOptions) {
  const { storage } = options;
  const cos = new COS({
    getAuthorization: await getAuthorizationThunk(storage)
  });

  let objects = options.objects;
  if (!objects || objects.length === 0) {
    if (!options.prefix) {
      throw new Error('请指定要删除的文件或路径前缀');
    }
    const result = await cos.getBucket({
      Bucket: storage.bucket,
      Region: storage.region,
      Prefix: options.prefix
    });
    objects = result.Contents.map(item => item.Key);
    if (objects.length === 0) {
      console.log('指定的前缀没有匹配到任何文件');
      return;
    }
    if (result.NextMarker) {
      console.log(
        `前缀匹配到的文件数量超过 ${objects.length} 个，可能没有完全列出，执行本次删除完成后可重复执行`
      );
    } else {
      console.log(`前缀匹配到 ${objects.length} 个文件`);
    }
  }

  try {
    const spinner = ora(`正在删除 ${objects.length} 个文件...`).start();
    const result = await cos.deleteMultipleObject({
      Bucket: storage.bucket,
      Region: storage.region,
      Objects: objects.map(object => ({ Key: object }))
    });
    spinner.stop();
    spinner.succeed(`删除成功`);
    logger.debug(result);
    return;
  } catch (err) {
    throw new Error(`删除文件失败: ${err.message}`);
  }
}

interface IDeleteObjectsOptions {
  storage: IGenericStorage;
  objects?: string[];
  prefix?: string;
}
