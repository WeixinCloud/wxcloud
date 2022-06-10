import got from 'got';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as tmp from 'tmp';
import * as tar from 'tar';
import ext from './global';
import { getProxyAgent } from '../utils/agent';
import * as configuration from '../configuration/configuration';
import { runDockerCommand } from '../utils/terminal';
import { cloudbase } from './cloudbase';
import { sleep, withTimeoutAndCancellationToken as $ } from '../utils/utils';
import { getConfiguration } from '../configuration/configuration';

const imageName = 'wxcloud-localdebug-proxy';
const VERSION_JSON_URL = 'https://dldir1.qq.com/WechatWebDev/clouddebugproxy/version.json';
let currentImageInfo: IProxyImageInfo = {
  version: 'latest',
  codeDir: '.',
};

let lockProxyImage: Promise<IEnsureProxyImageResult>;
export async function ensureProxyImage(p: (s: string) => void): Promise<IEnsureProxyImageResult> {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  if (lockProxyImage) return lockProxyImage;

  lockProxyImage = _ensureProxyImage(p);

  // cleanup
  lockProxyImage.then(() => {
    lockProxyImage = undefined;
  }).catch(() => {
    lockProxyImage = undefined;
  });

  return lockProxyImage;
}

export async function _ensureProxyImage(progress: (s: string) => void): Promise<IEnsureProxyImageResult> {
  // ensure code
  const imageTag = `${imageName}:${currentImageInfo.version}`;

  // check image
  progress('checking image');
  const images = await $(() => cloudbase.dockerode.listImages());
  if (images.some(image => image.RepoTags && image.RepoTags[0] === imageTag)) {
    // found
    return {
      imageName,
      imageTag,
      ...currentImageInfo,
    };
  }

  // build image
  progress('building image');
  await runDockerCommand({
    command: `docker build -t ${imageTag} .`,
    name: imageName,
    cwd: currentImageInfo.codeDir,
    rejectOnExitCode: true,
  });

  return {
    imageName,
    imageTag,
    ...currentImageInfo,
  };
}

let lockRemoteProxySetup: Promise<IEnsureRemoteProxySetup>;
export async function ensureRemoteProxySetup(p: (s: string) => void): Promise<IEnsureRemoteProxySetup> {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  if (lockRemoteProxySetup) return lockRemoteProxySetup;

  lockRemoteProxySetup = _ensureRemoteProxySetup(p);

  // cleanup
  lockRemoteProxySetup.then(() => {
    lockRemoteProxySetup = undefined;
  }).catch(() => {
    lockRemoteProxySetup = undefined;
  });

  return lockRemoteProxySetup;
}

export async function _ensureRemoteProxySetup(p: (s: string) => void): Promise<IEnsureRemoteProxySetup> {
  // check cloud env
  p('checking cloud env');
  const conf = configuration.getConfiguration();
  let envId = conf.vpcProxyTargetEnvId;
  if (!envId) {
    // get env list
    // const result: any = await $(() => ext.messenger.invoke('GET_ENV_LIST', {}))
    const result: any = await ext.backend.getEnvList();
    if (result.error) {
      throw new Error(`Get env list failed: ${result.error}`);
    }
    envId = await vscode.window.showQuickPick(result.list.map(env => env.envId), {
      placeHolder: '云环境 ID（本地调试访问 VPC 时将访问指定环境的 VPC）。Cloud EnvID. (will access the corresponding VPC during local debug)',
    });
    if (!envId) {
      throw new Error('must pick an envId');
    }
    configuration.setProxyTargetEnvId(envId);
  }

  // check if already exists
  p('checking debug proxy service');
  // const preQueryResult: any = await $(() => ext.messenger.invoke('QUERY_SERVICE', {
  const preQueryResult: any = await ext.backend.queryService({
    envId,
    serviceName: imageName,
  });
  if (preQueryResult.error) {
    throw new Error(`pre query debug proxy service failed ${preQueryResult.error}`);
  }
  const versionItemPredicator = (item) => {
    if (item.flowRatio === 100
      && item.status === 'normal') {
      return true;
    }
    return false;
  };
  // ensure debug server valid
  await ext.backend.ensureDebugServer({
    port: getConfiguration().ports.wx,
  });
  if (
    preQueryResult.domainInfo.defaultPublicDomain
    && preQueryResult.server.versionItems.some(versionItemPredicator)
    && preQueryResult.key
  ) {
    // exists
    // activate it, no wait
    // probe is no longer valid since otp is introduced.
    return {
      domain: preQueryResult.domainInfo.defaultPublicDomain,
      key: preQueryResult.key,
    };
  }
  if (!preQueryResult.key) {
    console.warn('no key found in result. server may be obsolete, re-deploying...');
  }

  // deploy
  p('deploying debug proxy service');
  // generate unique otp
  const TOAL_KEY = `TOAL_${Math.random().toString(36)
    .substring(2)}`;
  const deployResult: any = await ext.backend.deployService({
    envId,
    serviceName: imageName,
    versionOptions: {
      serverName: imageName,
      uploadType: 'image',
      versionRemark: TOAL_KEY,
      dockerfilePath: 'Dockerfile',
      flowRatio: 100,
      containerPort: 80,
      cpu: 0.25,
      maxNum: 1,
      mem: 0.5,
      minNum: 0,
      policyThreshold: 60,
      policyType: 'cpu',
      mountWxToken: true,
      useHttpRoute: true,
      imageInfo: {
        imageUrl: 'ccr.ccs.tencentyun.com/tcb_prd/wxcloud-localdebug-proxy:latest',
        isPublic: true,
        repositoryName: 'tcb_prd/wxcloud-localdebug-proxy',
        serverAddr: 'ccr.ccs.tencentyun.com',
        tagName: 'latest',
      },
      envParams: JSON.stringify({
        TOAL_KEY,
        TOAL_ROLE: 'server',
        TOAL_MODE: 'shortpoll',
        TOAL_VERBOSE: 'DEBUG',
      }),
    },
  });
  if (deployResult.error) {
    throw new Error(`deploy local debug proxy service failed ${deployResult.error}`);
  }

  // query service
  for (let i = 0; i < 60; i++) {
    p(`querying debug proxy build status #${i}`);
    const queryResult: any = await ext.backend.queryService({
      envId,
      serviceName: imageName,
    });
    console.log('[-] check result', queryResult);
    if (queryResult.error) {
      throw new Error(`query local debug proxy build status error ${queryResult.error}`);
    }
    if (queryResult.domainInfo.defaultPublicDomain && queryResult.server.versionItems.some(versionItemPredicator) && queryResult.key) {
      console.log('[+] check passed', queryResult);
      return {
        domain: queryResult.domainInfo.defaultPublicDomain,
        key: queryResult.key,
      };
    }
    await sleep(5000);
  }

  throw new Error('query local debug proxy build status error: no result after 5min');
}

let lockEnsureCode: Promise<IProxyImageInfo>;
export async function ensureCode(opt: IGetCodeOptions): Promise<IProxyImageInfo> {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  if (lockEnsureCode) return lockEnsureCode;

  lockEnsureCode = _ensureCode(opt);

  // cleanup
  lockEnsureCode.then(() => {
    lockEnsureCode = undefined;
  }).catch(() => {
    lockEnsureCode = undefined;
  });

  return lockEnsureCode;
}

async function _ensureCode(opt: IGetCodeOptions): Promise<IProxyImageInfo> {
  const { progress = () => { /* noop */ } } = opt;
  let { version } = opt;

  if (!version) {
    progress('checking version info of debug proxy image');
    const resp = await got.get<any>(VERSION_JSON_URL, {
      agent: getProxyAgent(),
      responseType: 'json',
    });
    if (resp.statusCode !== 200) {
      throw new Error(`check latest version failed, status ${resp.statusCode}`);
    }
    version = resp.body.latest;
  }

  const codeDir = path.join(tmp.tmpdir, 'wxclouddebugproxy', version);
  await fse.ensureDir(codeDir);
  await fse.emptyDir(codeDir);

  progress(`downloading debug proxy image version ${version}`);

  const resp = await got.get(`https://dldir1.qq.com/WechatWebDev/clouddebugproxy/${version}.tar.gz`, {
    agent: getProxyAgent(),
    responseType: 'buffer',
  });
  if (resp.statusCode === 200) {
    progress(`download debug proxy image version ${version} succeeded, extracting`);
    const filePath = path.join(tmp.tmpdir, 'wxclouddebugproxy', `${version}.tar.gz`);
    await fse.outputFile(filePath, resp.body);
    await tar.x({
      file: filePath,
      cwd: codeDir,
    });

    currentImageInfo = {
      version,
      codeDir,
    };
    console.log(`using proxy image: ${JSON.stringify(currentImageInfo)}`);
    return currentImageInfo;
  }
  throw new Error(`download ${version} code failed, status ${resp.statusCode}`);
}

interface IGetCodeOptions {
  progress?: (s: string) => void
  version?: string
}

interface IProxyImageInfo {
  version: string
  codeDir: string
}

interface IEnsureProxyImageResult extends IProxyImageInfo {
  imageName: string
  imageTag: string
}

interface IEnsureRemoteProxySetup {
  domain: string
  key: string
}

