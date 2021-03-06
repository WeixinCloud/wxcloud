import Command, { flags } from '@oclif/command';
import { CloudAPI } from '@wxcloud/core';
import { zipFile, zipToBuffer } from '../../utils/jszip';
const HelloWorldCode = `UEsDBBQACAAIALB+WU4AAAAAAAAAAAAAAAAIABAAaW5kZXguanNVWAwAAZ9zXPuec1z1ARQAdY7BCsIwEETv+Yoll6ZQ+wOhnv0DD+IhxkWC664kWwmI/27V3IpzGuYNw3RzQSiaU9TOG6x3yVrGW0gMEzh8IOsAUVixfkwgOoV47WHawtPAooUVIRxJLs7ukEhgL5nOtl/h79qf+GBZeIM1FbXHdac9aKC9cDwTDfCb9eblzRtQSwcI6+pcr4AAAADOAAAAUEsBAhUDFAAIAAgAsH5ZTuvqXK+AAAAAzgAAAAgADAAAAAAAAAAAQKSBAAAAAGluZGV4LmpzVVgIAAGfc1z7nnNcUEsFBgAAAAABAAEAQgAAAMYAAAAAAA==`;
const {
  scfGetFunctionInfo,
  tcbGetEnvironments,
  scfCreateFunction,
  scfUpdateFunctionInfo,
  scfUpdateFunction
} = CloudAPI;
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
    maxWaitTimeout = 15 * 60 * 1000
  } = options;

  return new Promise<void>(async (res, rej) => {
    const timeout = setTimeout(rej, maxWaitTimeout);
    try {
      let lastStatus = '';
      const startTime = +new Date();
      while (!done && +new Date() - startTime < maxWaitTimeout) {
        const info = await scfGetFunctionInfo({
          namespace,
          region,
          functionName,
          codeSecret: undefined
        });

        if (info.status !== lastStatus) {
          onStatusUpdate(info.status);
          lastStatus = info.status;
        }

        switch (info.status) {
          case 'Creating':
          case 'Updating':
          case 'Publishing':
          case 'UpdatingAndPublishing': {
            break;
          }
          case 'CreateFailed': {
            throw new Error(`create function failed: ${info.statusDesc}`);
          }
          case 'UpdateFailed': {
            throw new Error(`update function failed: ${info.statusDesc}`);
          }
          case 'Active': {
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
          typeof e === 'string' ? e : JSON.stringify(e)
        );
      } catch (e) {
        console.error(`upload ${namespace} ${functionName} failed: `, e.toString());
      }
    }
  });
}

export default class UploadFunctionCommand extends Command {
  static description = '???????????????';

  static examples = [`wxcloud function:upload <?????????????????????>`];
  static args = [{ name: 'path', description: '?????????????????????', default: '.' }];
  static flags = {
    help: flags.help({ char: 'h', description: '??????????????????' }),
    envId: flags.string({ char: 'e', description: '??????ID' }),
    name: flags.string({ char: 'n', description: '?????????' }),
    remoteNpmInstall: flags.boolean({
      description: '????????????????????????',
      default: true
    })
  };

  async run() {
    const { args, flags } = this.parse(UploadFunctionCommand);
    const { remoteNpmInstall } = flags;
    const envId = flags.envId;
    const name = flags.name;
    const fnPath = args.path || '.';
    console.log(
      `???????????? ${fnPath} ???????????? ${name}????????? ${envId}???${
        remoteNpmInstall ? '??????????????????' : '??????????????????'
      }`
    );
    const { envList } = await tcbGetEnvironments({});
    const currentEnv = envList.find(env => env.envId === envId);
    if (!currentEnv) {
      throw new Error(`?????? ${envId} ?????????`);
    }
    if (!name) {
      throw new Error(`??????????????????`);
    }

    const env = currentEnv.envId;
    const region = currentEnv.functions[0].region;
    await waitFuncDeploy({
      namespace: env,
      region,
      functionName: name
    });

    let shouldCreate = false;
    let info!: Awaited<ReturnType<typeof scfGetFunctionInfo>>;

    try {
      info = await scfGetFunctionInfo({
        namespace: env,
        region: '',
        functionName: name
      });

      if (info.status === 'DeleteFailed') {
        throw new Error(`delete failed`);
      }
    } catch (e) {
      if (e.code === 'ResourceNotFound.Function') {
        shouldCreate = true;
      } else throw e;
    }
    const log = console;
    log.info(`get cloudfunction info done`);
    log.info(`will ${shouldCreate ? 'create' : 'update'} cloudfunction`);

    if (shouldCreate) {
      await scfCreateFunction({
        functionName: name,
        code: {
          zipFile: HelloWorldCode
        },
        handler: 'index.main', // ????????????????????????????????????????????? "????????????.????????????" ?????????????????????????????????????????????"."?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????? 2-60 ?????????
        description: '', // ????????????,???????????? 1000 ????????????????????????????????????????????????????????????????????????????????????
        memorySize: 256, // ??????????????????????????????????????? 128M??????????????? 128MB-1536MB???????????? 128MB ?????????
        timeout: 3, // ????????????????????????????????????????????????????????? 1-300 ??????????????? 3 ???
        environment: {
          variables: []
        },
        role: 'TCB_QcsRole',
        runtime: 'Nodejs12.16',
        namespace: env,
        region,
        stamp: 'MINI_QCBASE',
        installDependency: remoteNpmInstall,
        clsLogsetId: currentEnv.logServices?.[0]?.logsetId,
        clsTopicId: currentEnv.logServices?.[0]?.topicId
      });

      log.info(`create cloudfunction done, continue to update code`);
    } else {
      if (info.status === 'Updating') {
        throw new Error(
          `there's another ongoing update, please wait for it to complete and try again later`
        );
      }

      const installDependencyStr = remoteNpmInstall ? 'TRUE' : 'FALSE';
      if (info.installDependency !== installDependencyStr) {
        log.info(`updating cloudfunction info`);
        await scfUpdateFunctionInfo({
          namespace: env,
          region,
          functionName: name,
          installDependency: remoteNpmInstall,
          clsLogsetId: currentEnv.logServices?.[0]?.logsetId,
          clsTopicId: currentEnv.logServices?.[0]?.topicId
        });
        log.info(`update cloudfunction info done, waiting for it to take into effect`);

        await waitFuncDeploy({
          namespace: env,
          region,
          functionName: name
        });

        log.info(`cloudfunction info updated`);
      }
    }

    const zip = zipFile(fnPath, {
      ignore: remoteNpmInstall ? ['node_modules'] : undefined
    });
    const zipBuffer = await zipToBuffer(zip);

    log.info(`zip file done, updating cloudfunction code`);

    await scfUpdateFunction({
      functionName: name,
      namespace: env,
      region,
      handler: 'index.main',
      installDependency: remoteNpmInstall,
      fileData: zipBuffer.toString('base64')
    });

    log.info(
      `cloudfunction code updated, ${
        remoteNpmInstall ? 'installing dependencies in the cloud and deploying' : 'deploying'
      }`
    );

    await waitFuncDeploy({
      namespace: env,
      region,
      functionName: name
    });

    log.info(`deployed`);
  }
}
