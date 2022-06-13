import type {
  IBackendService,
  INotifyOptions,
  IEnsureDebugServerOptions,
  IGetEnvListResult,
  IQueryServiceResult,
  IDeployServiceResult,
  IQueryServiceOptions,
  IDeployServiceOptions,
  IExtListResult
} from './backend';
import * as vscode from 'vscode';
import { LocalWxServer } from '../wxserver';
import { cloudbase } from '../cloudbase';
import { getConfiguration } from '../../configuration/configuration';
import * as _ from 'lodash';
import { CloudAPI } from '@wxcloud/core';
import crypto from 'crypto';
import got from 'got';
import { merge } from 'lodash';

export function initCloudAPI(appid: string) {
  CloudAPI.setDefaultAppID(appid);
  CloudAPI.setTransactType(CloudAPI.TransactType.IDE);
  CloudAPI.setRequest(transactRequest as any);
}

export const BASE_URL = 'https://servicewechat.com';
let CORE_IDENTITY = {
  appid: '',
  privateKey: ''
};
async function transactRequest<T = any>(options: CloudAPI.IRequestOptions): Promise<T> {
  const { body, statusCode } = await got.post(`${BASE_URL}/wxa-dev-qbase/apihttpagent`, {
    searchParams: {
      appid: CORE_IDENTITY.appid,
      autodev: 1
    },
    method: 'post',
    json: {
      postdata: options.postdata,
      ...merge({}, options.identity)
    },
    headers: {
      ...options.headers,
      'content-type': 'application/json',
      'X-CloudRunCli-Robot': '1',
      'X-CloudRunCli-Key': CORE_IDENTITY.privateKey
    }
  });

  if (statusCode === 413) {
    throw new Error(`Body too large`);
  }

  if (!body) {
    throw new Error(`Empty body ${body}`);
  }

  const parsedBody = JSON.parse(body);
  if (parsedBody.errCode) {
    throw new Error(`${parsedBody.errCode} ${parsedBody.errMsg}`);
  }

  const parsedResp = parsedBody;
  // tslint:disable-next-line
  if (!parsedResp || !parsedResp.base_resp || parsedResp.base_resp.ret != '0') {
    if (parsedResp.base_resp.ret === 80210) {
      throw new Error(`NO_CLOUD_MANAGE_PERMISSION_AUTHORIZED_TO_3RD_PLATFORM`);
    }
    throw new Error(`Base resp abnormal, ${JSON.stringify(parsedResp?.base_resp)}`);
  }
  const content: T = parsedResp.content;
  return content;
}

const camelize = (obj: any) =>
  _.transform<any, any>(obj, (acc, value, key: string, target) => {
    const camelKey = _.isArray(target) ? key : _.camelCase(key);

    acc[camelKey] = _.isObject(value) ? camelize(value) : value;
  });

export class CoreBackendService implements IBackendService {
  type = 'core';
  wxServer?: LocalWxServer;
  loggedIn = false;
  credientials: {
    appid: string;
    privateKey: string;
  };
  cachedExtList: Map<string, IExtListResult> = new Map();
  async _invokeWxApi<T = any>(options: {
    api: string;
    method?: 'GET' | 'POST';
    params?: Record<string, string>;
    body?: any;
  }): Promise<T> {
    console.log('_invokeWxApi', options.api);
    const res: T = await got(`${BASE_URL}${options.api}`, {
      searchParams: {
        appid: CORE_IDENTITY.appid,
        autodev: 1,
        ...options.params
      },
      method: options.method || 'get',
      headers: {
        'X-CloudRunCli-Robot': '1',
        'X-CloudRunCli-Key': CORE_IDENTITY.privateKey
      },
      body: options.body
    }).json();
    return res;
  }
  async _checkLogin() {
    try {
      console.log('_checkLogin');
      // use getqbaseinfo to check login
      const res = await this._invokeWxApi({
        api: '/wxa-dev-qbase/getqbaseinfo'
      });
      if (res?.base_resp?.ret === 0) {
        this.loggedIn = true;
        console.log('_checkLogin', true);
        return true;
      }
      console.log('_checkLogin', false);
      return false;
    } catch (error) {
      console.log('_checkLogin', error);
      return false;
    }
  }

  init(appid: string, privateKey: string) {
    CORE_IDENTITY = {
      appid,
      privateKey
    };
    CloudAPI.setDefaultAppID(appid);
    CloudAPI.setRequest(transactRequest);
    CloudAPI.setTransactType(CloudAPI.TransactType.IDE);

    this._checkLogin()
      .then(() => {
        console.log('login to wxcloud success');
        this.loggedIn = true;
      })
      .then(() => {
        this.ensureDebugServer({
          port: getConfiguration().ports.wx
        });
      })
      .catch(() => {
        this.loggedIn = false;
        if (getConfiguration().ciKey) {
          // upgrade from ci key
          vscode.window
            .showWarningMessage(
              '云托管本地调试插件已升级为 CLI 密钥登录，请前往云托管控制台 - 设置 - 全局设置 - CLI 秘钥生成秘钥，使用新的秘钥配置。',
              '登录云托管控制台',
              '查看设置',
              '取消'
            )
            .then(ans => {
              if (ans === '登录云托管控制台') {
                vscode.commands.executeCommand(
                  'vscode.open',
                  vscode.Uri.parse('https://cloud.weixin.qq.com/cloudrun/settings/other')
                );
              }
              if (ans === '查看设置') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'wxcloud');
              }
            });
          return;
        }
        vscode.window
          .showWarningMessage(
            privateKey
              ? '登录失败，请检查设置中 AppID 和 CLI Token 是否正确配置。'
              : '使用云托管调试前，请前往云托管控制台 - 设置 - 全局设置 - CLI 秘钥生成秘钥，并在配置中填入 AppID 和 CLI 秘钥',
            '登录云托管控制台',
            '查看设置',
            '取消'
          )
          .then(ans => {
            if (ans === '登录云托管控制台') {
              vscode.commands.executeCommand(
                'vscode.open',
                vscode.Uri.parse('https://cloud.weixin.qq.com/cloudrun/settings/other')
              );
            }
            if (ans === '查看设置') {
              vscode.commands.executeCommand('workbench.action.openSettings', 'wxcloud');
            }
          });
      });
  }
  notify(_opt: INotifyOptions): void {
    // noop in CLI Backend
  }
  async getExtList(opt: { envId: string; appid: string }): Promise<IExtListResult> {
    const key = `${opt.envId}-${opt.appid}`;
    if (this.cachedExtList.has(key)) {
      return this.cachedExtList.get(key);
    }
    const services = [];
    if (opt.envId && opt.appid) {
      // current supported ext: mysql
      const mysql = await CloudAPI.tcbDescribeWxCloudBaseRunDBClusterDetail({
        envId: opt.envId,
        wxAppId: opt.appid
      });
      if (mysql.netInfo.privateNetAddress) {
        const netAddr = mysql.netInfo.privateNetAddress;
        services.push({ name: `MySQL (${netAddr})`, ip: netAddr });
      }
    }
    const result = { services };
    this.cachedExtList.set(key, result);
    return result;
  }
  async attachService(_data: any): Promise<void> {
    // noop in CLI Backend
    return Promise.resolve();
  }
  async detachService(_data: any): Promise<void> {
    // noop in CLI Backend
    return Promise.resolve();
  }

  async ensureDebugServer(opt: IEnsureDebugServerOptions) {
    if (!opt.new && this.wxServer) {
      return;
    }
    if (!this.loggedIn) {
      throw new Error('未登录，请确认 CLI Token 和 AppID 已正确配置。');
    }
    // begin serveLocal
    this.wxServer = new LocalWxServer({
      port: opt.port,
      getMappings: async () => {
        const containers = await cloudbase.getContainers();
        return containers
          .filter(c => c.container?.State === 'running')
          .map(c => ({
            from: c.name,
            to: `http://127.0.0.1:${c.container!.Ports?.find(info => info.PublicPort)?.PublicPort}`
          }));
      },
      backend: this
    });
    await this.wxServer.listen();
  }

  async getEnvList(): Promise<IGetEnvListResult> {
    if (!this.loggedIn) {
      throw new Error('未登录，请确认 CLI Token 和 AppID 已正确配置。');
    }
    const result = await CloudAPI.tcbDescribeWxCloudBaseRunEnvs({});
    return {
      list: result.envList
    };
  }

  async queryService(opt: IQueryServiceOptions): Promise<IQueryServiceResult> {
    // return $(() => ext.messenger.invoke('QUERY_SERVICE', opt)) as any;
    if (!this.loggedIn) {
      throw new Error('未登录，请确认 CLI Token 和 AppID 已正确配置。');
    }
    const { envId, serviceName } = opt;
    const domainInfo = await CloudAPI.tcbDescribeCloudBaseRunServiceDomain({
      envId,
      serviceName
    });
    const service = await CloudAPI.tcbDescribeCloudBaseRunServer({
      envId,
      serverName: serviceName,
      limit: 1,
      offset: 0
    });
    if (service.versionItems?.[0]) {
      if (service.versionItems[0].remark.startsWith('TOAL_')) {
        return {
          server: service,
          domainInfo,
          key: service.versionItems[0].remark
        };
      }
    }
    // our return type need to be camel case
    return {
      server: service,
      domainInfo
    };
  }

  // old api (version)
  async deployServiceV1(opt: IDeployServiceOptions): Promise<IDeployServiceResult> {
    // create service if not exists
    const service = await CloudAPI.tcbDescribeCloudBaseRunServer({
      envId: opt.envId,
      serverName: opt.serviceName,
      limit: 1,
      offset: 0
    });
    console.log('[-] query service status', service);
    if (!service.serverName) {
      console.log('[+] establish run service(legacy)');
      await CloudAPI.tcbEstablishCloudBaseRunServer({
        envId: opt.envId,
        isPublic: true,
        serviceName: opt.serviceName
      });
    }
    const payload = {
      DeployType: opt.versionOptions.uploadType,
      EnvId: opt.envId,
      BuildDir: opt.versionOptions.buildDir,
      Dockerfile: opt.versionOptions.dockerfilePath,
      HasDockerfile: true,
      ImageUrl: opt.versionOptions.imageInfo.imageUrl,
      Port: opt.versionOptions.containerPort,
      ReleaseType: 'FULL',
      ServerName: opt.serviceName,
      WxAppId: getConfiguration().appid
    };
    console.log('[+] direct create version', payload);
    const res = await CloudAPI.tcbCreateCloudBaseRunServerVersion({
      buildDir: '',
      containerPort: opt.versionOptions.containerPort,
      cpu: opt.versionOptions.cpu,
      dockerfilePath: opt.versionOptions.dockerfilePath,
      envId: opt.envId,
      envParams: opt.versionOptions.envParams,
      flowRatio: opt.versionOptions.flowRatio,
      maxNum: opt.versionOptions.maxNum,
      mem: opt.versionOptions.mem,
      minNum: opt.versionOptions.minNum,
      mountWxToken: true,
      imageInfo: {
        imageUrl: opt.versionOptions.imageInfo.imageUrl,
        isPublic: opt.versionOptions.imageInfo.isPublic,
        repositoryName: opt.versionOptions.imageInfo.repositoryName,
        serverAddr: opt.versionOptions.imageInfo.serverAddr,
        tagName: opt.versionOptions.imageInfo.tagName
      },
      policyType: opt.versionOptions.policyType,
      policyThreshold: opt.versionOptions.policyThreshold,
      serverName: opt.serviceName,
      uploadType: opt.versionOptions.uploadType,
      versionRemark: opt.versionOptions.versionRemark
    });
    console.log(res);
    return res;
  }

  async deployService(opt: IDeployServiceOptions): Promise<IDeployServiceResult> {
    if (!this.loggedIn) {
      throw new Error('未登录，请确认 CLI Token 和 AppID 已正确配置。');
    }
    // create service if not exists
    const service = await CloudAPI.tcbDescribeCloudBaseRunServer({
      envId: opt.envId,
      serverName: opt.serviceName,
      limit: 1,
      offset: 0
    });
    console.log('[-] query service status', service);
    if (!service.serverName) {
      console.log('[+] establish run service');
      await CloudAPI.tcbEstablishCloudBaseRunServerWx({
        envId: opt.envId,
        isPublic: true,
        serviceName: opt.serviceName,
        openAccessTypes: ['MINIAPP', 'PUBLIC']
      });
    }
    // set env variables -- since v2 api seperated this from version options.
    const oldConfig = await CloudAPI.tcbDescribeServiceBaseConfig({
      envId: opt.envId,
      serverName: opt.serviceName
    });
    console.log('[!] oldConfig', oldConfig.serviceBaseConfig);
    // copy only allowed fields
    const envRes = await CloudAPI.tcbUpdateServerBaseConfig({
      wxAppId: getConfiguration().appid,
      conf: {
        ...oldConfig.serviceBaseConfig,
        envParams: opt.versionOptions.envParams
      },
      envId: opt.envId,
      serverName: opt.serviceName
    });
    console.log('[+] update env variables', envRes);
    const payload = {
      deployType: opt.versionOptions.uploadType,
      envId: opt.envId,
      buildDir: opt.versionOptions.buildDir,
      dockerfile: opt.versionOptions.dockerfilePath,
      hasDockerfile: true,
      imageUrl: opt.versionOptions.imageInfo.imageUrl,
      port: opt.versionOptions.containerPort,
      releaseType: 'FULL',
      serverName: opt.serviceName,
      wxAppId: getConfiguration().appid,
      versionRemark: opt.versionOptions.versionRemark
    };
    console.log('[+] submit release', payload);
    const res = await CloudAPI.tcbSubmitServerRelease(payload);
    console.log('[+] submit result', res);
    return res;
  }
}
