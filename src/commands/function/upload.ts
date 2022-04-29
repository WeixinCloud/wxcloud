import Command, { flags } from "@oclif/command";
import {
  scfGetFunctionInfo,
  tcbGetEnvironments,
  scfCreateFunction,
  scfUpdateFunctionInfo,
  scfUpdateFunction,
} from "../../api/cloudapi";
import { zipFile, zipToBuffer } from "../../utils/jszip";
const HelloWorldCode = `UEsDBBQACAAIALB+WU4AAAAAAAAAAAAAAAAIABAAaW5kZXguanNVWAwAAZ9zXPuec1z1ARQAdY7BCsIwEETv+Yoll6ZQ+wOhnv0DD+IhxkWC664kWwmI/27V3IpzGuYNw3RzQSiaU9TOG6x3yVrGW0gMEzh8IOsAUVixfkwgOoV47WHawtPAooUVIRxJLs7ukEhgL5nOtl/h79qf+GBZeIM1FbXHdac9aKC9cDwTDfCb9eblzRtQSwcI6+pcr4AAAADOAAAAUEsBAhUDFAAIAAgAsH5ZTuvqXK+AAAAAzgAAAAgADAAAAAAAAAAAQKSBAAAAAGluZGV4LmpzVVgIAAGfc1z7nnNcUEsFBgAAAAABAAEAQgAAAMYAAAAAAA==`;

async function waitFuncDeploy(options: {
  namespace: string;
  region: string;
  functionName: string;
  onStatusUpdate?: (status: string) => void;
  maxWaitTimeout?: number;
}) {
  let done = false;
  const {
    namespace,
    region,
    functionName,
    onStatusUpdate = (status: string) => {
      console.log(
        `env ${options.namespace}'s cloudfunction '${options.functionName}' status: ${status}`
      );
    },
    maxWaitTimeout = 15 * 60 * 1000,
  } = options;

  return new Promise(async (res, rej) => {
    const timeout = setTimeout(rej, maxWaitTimeout);
    try {
      let lastStatus = "";
      const startTime = +new Date();
      while (!done && +new Date() - startTime < maxWaitTimeout) {
        const info = await scfGetFunctionInfo({
          namespace,
          region,
          functionName,
          codeSecret: undefined,
        });

        if (info.status !== lastStatus) {
          onStatusUpdate(info.status);
          lastStatus = info.status;
        }

        switch (info.status) {
          case "Creating":
          case "Updating":
          case "Publishing":
          case "UpdatingAndPublishing": {
            break;
          }
          case "CreateFailed": {
            throw new Error(`create function failed: ${info.statusDesc}`);
          }
          case "UpdateFailed": {
            throw new Error(`update function failed: ${info.statusDesc}`);
          }
          case "Active": {
            done = true;
            clearTimeout(timeout);
            res();
            break;
          }
        }
      }
    } catch (e) {
      try {
        console.error(
          `upload ${namespace} ${functionName} failed: `,
          typeof e === "string" ? e : JSON.stringify(e)
        );
      } catch (e) {
        console.error(
          `upload ${namespace} ${functionName} failed: `,
          e.toString()
        );
      }
    }
  });
}

export default class UploadFunctionCommand extends Command {
  static description = "创建云函数";

  static examples = [`wxcloud function:upload <云函数代码目录>`];
  static args = [{ name: "path", description: "云函数代码目录", default: "." }];
  static flags = {
    help: flags.help({ char: "h", description: "查看帮助信息" }),
    envId: flags.string({ char: "e", description: "环境ID" }),
    name: flags.string({ char: "n", description: "函数名" }),
    remoteNpmInstall: flags.boolean({
      description: "是否云端安装依赖",
      default: true,
    }),
  };

  async run() {
    const { args, flags } = this.parse(UploadFunctionCommand);
    const { remoteNpmInstall } = flags;
    const envId = flags.envId;
    const name = flags.name;
    const fnPath = args.path || ".";
    console.log(
      `即将上传 ${fnPath} 到云函数 ${name}，环境 ${envId}，${
        remoteNpmInstall ? "云端安装依赖" : "本地安装依赖"
      }`
    );
    const { envList } = await tcbGetEnvironments({});
    const currentEnv = envList.find((env) => env.envId === envId);
    if (!currentEnv) {
      throw new Error(`环境 ${envId} 不存在`);
    }
    if (!name) {
      throw new Error(`请指定函数名`);
    }

    const env = currentEnv.envId;
    const region = currentEnv.functions[0].region;
    await waitFuncDeploy({
      namespace: env,
      region,
      functionName: name,
    });

    let shouldCreate = false;
    let info!: IAPISCFGetFunctionInfoResult;

    try {
      info = await scfGetFunctionInfo({
        namespace: env,
        region: "",
        functionName: name,
      });

      if (info.status === "DeleteFailed") {
        throw new Error(`delete failed`);
      }
    } catch (e) {
      if (e.code === "ResourceNotFound.Function") {
        shouldCreate = true;
      } else throw e;
    }
    const log = console;
    log.info(`get cloudfunction info done`);
    log.info(`will ${shouldCreate ? "create" : "update"} cloudfunction`);

    if (shouldCreate) {
      await scfCreateFunction({
        functionName: name,
        code: {
          zipFile: HelloWorldCode,
        },
        handler: "index.main", // 函数处理方法名称，名称格式支持 "文件名称.方法名称" 形式，文件名称和函数名称之间以"."隔开，文件名称和函数名称要求以字母开始和结尾，中间允许插入字母、数字、下划线和连接符，文件名称和函数名字的长度要求是 2-60 个字符
        description: "", // 函数描述,最大支持 1000 个英文字母、数字、空格、逗号、换行符和英文句号，支持中文
        memorySize: 256, // 函数运行时内存大小，默认为 128M，可选范围 128MB-1536MB，并且以 128MB 为阶梯
        timeout: 3, // 函数最长执行时间，单位为秒，可选值范围 1-300 秒，默认为 3 秒
        environment: {
          variables: [],
        },
        role: "TCB_QcsRole",
        runtime: "Nodejs12.16",
        namespace: env,
        region,
        stamp: "MINI_QCBASE",
        installDependency: remoteNpmInstall,
        clsLogsetId: currentEnv.logServices?.[0]?.logsetId,
        clsTopicId: currentEnv.logServices?.[0]?.topicId,
      });

      log.info(`create cloudfunction done, continue to update code`);
    } else {
      if (info.status === "Updating") {
        throw new Error(
          `there's another ongoing update, please wait for it to complete and try again later`
        );
      }

      const installDependencyStr = remoteNpmInstall ? "TRUE" : "FALSE";
      if (info.installDependency !== installDependencyStr) {
        log.info(`updating cloudfunction info`);
        await scfUpdateFunctionInfo({
          namespace: env,
          region,
          functionName: name,
          installDependency: remoteNpmInstall,
          clsLogsetId: currentEnv.logServices?.[0]?.logsetId,
          clsTopicId: currentEnv.logServices?.[0]?.topicId,
        });
        log.info(
          `update cloudfunction info done, waiting for it to take into effect`
        );

        await waitFuncDeploy({
          namespace: env,
          region,
          functionName: name,
        });

        log.info(`cloudfunction info updated`);
      }
    }

    const zip = zipFile(fnPath, {
      ignore: remoteNpmInstall ? ["node_modules"] : undefined,
    });
    const zipBuffer = await zipToBuffer(zip);

    log.info(`zip file done, updating cloudfunction code`);

    await scfUpdateFunction({
      functionName: name,
      namespace: env,
      region,
      handler: "index.main",
      installDependency: remoteNpmInstall,
      fileData: zipBuffer.toString("base64"),
    });

    log.info(
      `cloudfunction code updated, ${
        remoteNpmInstall
          ? "installing dependencies in the cloud and deploying"
          : "deploying"
      }`
    );

    await waitFuncDeploy({
      namespace: env,
      region,
      functionName: name,
    });

    log.info(`deployed`);
  }
}
