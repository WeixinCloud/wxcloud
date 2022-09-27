import Command, { flags } from '@oclif/command';
import { CloudAPI } from '@wxcloud/core';
import { resolve, relative, sep, posix } from 'path';
import { promises } from 'fs';
import COS from 'cos-nodejs-sdk-v5';
import { fetchApi } from '../../api/base';
import { readLoginState } from '../../utils/auth';
import { REGION_COMMAND_FLAG } from '../../utils/flags';
import { ApiRegion, setApiCommonParameters } from '../../api/common';
import ora from 'ora';
import { cli } from 'cli-ux';
import { logger } from '../../utils/log';

const { tcbGetEnvironments, tcbDescribeWxCloudBaseRunEnvs } = CloudAPI;
const { readdir, readFile } = promises;
export default class UploadStorageCommand extends Command {
  static description = '上传对象存储';

  static examples = [`wxcloud storage:upload <文件目录>`];
  static args = [{ name: 'path', description: '文件目录', default: '.' }];
  static flags = {
    help: flags.help({ char: 'h', description: '查看帮助信息' }),
    region: REGION_COMMAND_FLAG,
    envId: flags.string({ char: 'e', description: '环境ID' }),
    remotePath: flags.string({ char: 'r', description: '目标目录' }),
    concurrency: flags.integer({ char: 'c', description: '并发上传数量' }),
    mode: flags.enum({
      char: 'm',
      options: ['staticstorage', 'storage'],
      description: '上传模式'
    })
  };

  async run() {
    const { args, flags } = this.parse(UploadStorageCommand);
    setApiCommonParameters({ region: flags.region as ApiRegion });
    const { remotePath = '', concurrency = 5, mode = 'storage' } = flags;
    const envId = flags.envId;
    const path = args.path || '.';
    console.log(`即将上传 ${path} 到云对象存储的 ${remotePath} 下，环境 ${envId}`);
    const envRes = await Promise.all([
      tcbGetEnvironments({}),
      tcbDescribeWxCloudBaseRunEnvs({ allRegions: true })
    ]);
    const envList = [...envRes[0].envList, ...envRes[1].envList];
    const currentEnv = envList.find(env => env.envId === envId);
    if (!currentEnv) {
      throw new Error(`环境 ${envId} 不存在`);
    }

    let normalizedRemotePath = remotePath.endsWith('/') ? remotePath : `${remotePath}/`;
    if (normalizedRemotePath.startsWith('/')) {
      normalizedRemotePath = normalizedRemotePath.slice(1);
    }

    if (mode === 'staticstorage') {
      const staticStorageInfo = currentEnv.staticStorages?.[0];
      // check status
      if (!staticStorageInfo || staticStorageInfo.status !== 'online') {
        throw new Error(`存储状态异常 ${staticStorageInfo.status}`);
      }
      // begin enumerate all files in localpath
      await beginUpload(path, staticStorageInfo, normalizedRemotePath, concurrency);
      return;
    }

    if (mode === 'storage') {
      const storage = currentEnv.storages?.[0];
      if (!storage) {
        throw new Error(`存储状态异常 ${storage}`);
      }
      // begin enumerate all files in localpath
      await beginUpload(path, storage, normalizedRemotePath, concurrency);
      return;
    }
  }
}

export async function beginUpload(
  path: string,
  storage: IGenericStorage,
  normalizedRemotePath: string,
  concurrency: number,
  uploadedFileSet: Set<string> = new Set()
) {
  // filter uploaded files
  // do not upload uploaded-file twice
  const files = (await getFiles(path)).filter(item => !uploadedFileSet.has(item));
  files.forEach(rp => uploadedFileSet.add(rp));
  const relativePaths: string[] = files
    .map(p => relative(path, p))
    .map(p => p.split(sep).join(posix.sep));
  const log = console;
  const res = await putObjectToCos(
    relativePaths.map((rp, i) => {
      return {
        Bucket: storage.bucket,
        Region: storage.region,
        Key: normalizedRemotePath + rp,
        Body: files[i]
      };
    }),
    storage,
    concurrency,
    path
  );
  ora().succeed('上传文件成功');
}

async function getFiles(dir: string): Promise<string[]> {
  try {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map((dirent: any) => {
        const res = resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
      })
    );
    return Array.prototype.concat(...files);
  } catch (e) {
    logger.debug(e);
    return [];
  }
}
interface IGenericStorage {
  bucket: string;
  region: string;
}

async function putObjectToCos(
  files: COS.PutObjectParams[],
  storage: IGenericStorage,
  concurrency: number,
  path: string
) {
  const cos = new COS({
    getAuthorization: await getAuthorizationThunk(storage)
  });

  // getCosMeta: get uploader info
  const cosMetadataRes = await fetchApi('wxa-dev-qbase/route/cosmetafield', {
    action: 'batchencode',
    bucket: storage.bucket,
    mpappid: (await readLoginState()).appid,
    paths: files.map(file => file.Key)
  });
  const cosMetadata = JSON.parse(cosMetadataRes.data).x_cos_meta_field_strs;
  const log = console;
  // mapping files to metadata
  const map = new Map(files.map((file, index) => [file.Key, cosMetadata[index]]));
  try {
    const total = files.length;
    let lastUpload = '';
    // need to fire up cos by putting one first
    const customBar = cli.progress({
      format: `${path} | {bar} | {value}/{total} Files`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591'
    });
    customBar.start(total, 0);
    const uploadFile = async (file?: COS.PutObjectParams) => {
      if (!file) return;
      const res = await cos.putObject({
        ...file,
        // 将文件的路径转为真正的内容
        Body: await readFile(file.Body as string),
        Headers: {
          'x-cos-meta-fileid': map.get(file.Key)
        }
      });
      lastUpload = file.Key;
      customBar.increment();
      return res;
    };
    await uploadFile(files.shift());
    while (files.length > 0) {
      const batch = files.splice(0, Math.min(files.length, concurrency)).map(uploadFile);
      await Promise.all(batch);
    }
    customBar.stop();
    return { success: true };
  } catch (err) {
    throw new Error(`上传文件失败: ${err.message}`);
  }
}

async function getAuthorizationThunk(storage: IGenericStorage) {
  async function getAuthorization(options: {}, callback: (result: any) => void) {
    const timestamp = Date.now();
    const rawCredientials = await fetchApi('wxa-dev-qbase/gettcbtoken', {
      region: storage.region,
      source: storage.bucket,
      scene: 'TOKEN_SCENE_COS',
      service: 'cos'
    });
    if (!rawCredientials) {
      throw new Error(`getFederalToken failed: ${JSON.stringify(rawCredientials)}`);
    }
    const credentials = {
      TmpSecretId: rawCredientials.secretid,
      TmpSecretKey: rawCredientials.secretkey,
      XCosSecurityToken: rawCredientials.token,
      StartTime: ~~(timestamp / 1000), // 时间戳，单位秒，如：1580000000 1620272999264
      ExpiredTime: rawCredientials.expired_time // 时间戳，单位秒，如：1580000900
    };

    callback(credentials);

    return;
  }

  return getAuthorization;
}
