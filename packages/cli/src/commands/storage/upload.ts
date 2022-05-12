import Command, { flags } from "@oclif/command";
import { CloudAPI } from "@wxcloud/core";
import { resolve, relative } from "path";
import { promises } from "fs";
import COS from "cos-nodejs-sdk-v5";
import { fetchApi } from "../../api/base";
import { readLoginState } from "../../utils/auth";
import { REGION_COMMAND_FLAG } from "../../utils/flags";
import { ApiRegion, setApiCommonParameters } from "../../api/common";

const { tcbGetEnvironments, tcbDescribeWxCloudBaseRunEnvs } = CloudAPI;
const { readdir, readFile } = promises;
export default class UploadStorageCommand extends Command {
  static description = "上传对象存储";

  static examples = [`wxcloud storage:upload <文件目录>`];
  static args = [{ name: "path", description: "文件目录", default: "." }];
  static flags = {
    help: flags.help({ char: "h", description: "查看帮助信息" }),
    region: REGION_COMMAND_FLAG,
    envId: flags.string({ char: "e", description: "环境ID" }),
    remotePath: flags.string({ char: "r", description: "目标目录" }),
    concurrency: flags.integer({ char: "c", description: "并发上传数量" }),
    mode: flags.enum({
      char: "m",
      options: ["staticstorage", "storage"],
      description: "上传模式",
    }),
  };

  async run() {
    const { args, flags } = this.parse(UploadStorageCommand);
    setApiCommonParameters({ region: flags.region as ApiRegion });
    const { remotePath = "", concurrency = 5, mode = "storage" } = flags;
    const envId = flags.envId;
    const path = args.path || ".";
    console.log(
      `即将上传 ${path} 到云对象存储的 ${remotePath} 下，环境 ${envId}`
    );
    const envRes = await Promise.all([
      tcbGetEnvironments({}),
      tcbDescribeWxCloudBaseRunEnvs({ allRegions: true }),
    ]);
    const envList = [...envRes[0].envList, ...envRes[1].envList];
    const currentEnv = envList.find((env) => env.envId === envId);
    if (!currentEnv) {
      throw new Error(`环境 ${envId} 不存在`);
    }

    let normalizedRemotePath = remotePath.endsWith("/")
      ? remotePath
      : `${remotePath}/`;
    if (normalizedRemotePath.startsWith("/")) {
      normalizedRemotePath = normalizedRemotePath.slice(1);
    }

    if (mode === "staticstorage") {
      const staticStorageInfo = currentEnv.staticStorages?.[0];
      // check status
      if (!staticStorageInfo || staticStorageInfo.status !== "online") {
        throw new Error(`存储状态异常 ${staticStorageInfo.status}`);
      }
      // begin enumerate all files in localpath
      await beginUpload(
        path,
        staticStorageInfo,
        normalizedRemotePath,
        concurrency
      );
      return;
    }

    if (mode === "storage") {
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
  concurrency: number
) {
  const files = await getFiles(path);
  const relativePaths = files.map((p) => relative(path, p));
  const log = console;
  log.info("文件获取完成，准备上传");
  const res = await putObjectToCos(
    relativePaths.map((rp, i) => ({
      Bucket: storage.bucket,
      Region: storage.region,
      Key: normalizedRemotePath + rp,
      Body: files[i],
    })),
    storage,
    concurrency
  );
  log.info(res);
}

async function getFiles(dir: string) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent: any) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}
interface IGenericStorage {
  bucket: string;
  region: string;
}

async function putObjectToCos(
  files: COS.PutObjectParams[],
  storage: IGenericStorage,
  concurrency: number
) {
  const cos = new COS({
    getAuthorization: await getAuthorizationThunk(storage),
  });

  // getCosMeta: get uploader info
  const cosMetadataRes = await fetchApi("wxa-dev-qbase/route/cosmetafield", {
    action: "batchencode",
    bucket: storage.bucket,
    mpappid: (await readLoginState()).appid,
    paths: files.map((file) => file.Key),
  });
  const cosMetadata = JSON.parse(cosMetadataRes.data).x_cos_meta_field_strs;
  const log = console;
  // mapping files to metadata
  const map = new Map(
    files.map((file, index) => [file.Key, cosMetadata[index]])
  );
  try {
    const total = files.length;
    let lastUpload = "";
    // need to fire up cos by putting one first
    const uploadFile = async (file?: COS.PutObjectParams) => {
      if (!file) return;
      const res = await cos.putObject({
        ...file,
        // 将文件的路径转为真正的内容
        Body: await readFile(file.Body as string),
        Headers: {
          "x-cos-meta-fileid": map.get(file.Key),
        },
      });
      lastUpload = file.Key;
      return res;
    };
    await uploadFile(files.shift());
    while (files.length > 0) {
      const batch = files
        .splice(0, Math.min(files.length, concurrency))
        .map(uploadFile);
      log.info(`正在上传 ${total - files.length} / ${total}: ${lastUpload}`);
      await Promise.all(batch);
    }
    return { success: true };
  } catch (err) {
    throw new Error(`上传文件失败: ${err.message}`);
  }
}

async function getAuthorizationThunk(storage: IGenericStorage) {
  async function getAuthorization(
    options: {},
    callback: (result: any) => void
  ) {
    const timestamp = Date.now();
    const rawCredientials = await fetchApi("wxa-dev-qbase/gettcbtoken", {
      region: storage.region,
      source: storage.bucket,
      scene: "TOKEN_SCENE_COS",
      service: "cos",
    });
    if (!rawCredientials) {
      throw new Error(
        `getFederalToken failed: ${JSON.stringify(rawCredientials)}`
      );
    }
    const credentials = {
      TmpSecretId: rawCredientials.secretid,
      TmpSecretKey: rawCredientials.secretkey,
      XCosSecurityToken: rawCredientials.token,
      StartTime: ~~(timestamp / 1000), // 时间戳，单位秒，如：1580000000 1620272999264
      ExpiredTime: rawCredientials.expired_time, // 时间戳，单位秒，如：1580000900
    };

    callback(credentials);

    return;
  }

  return getAuthorization;
}
