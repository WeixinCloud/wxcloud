import * as fse from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import { EventEmitter } from 'events';
import ext from '../core/global';
import { createProxyServer } from 'http-proxy';
// import { WXCloud } from '../libs/wxcloud-cli';
import got from 'got';
import { CloudAPI } from '@wxcloud/core';
import * as vscode from 'vscode';
import { BASE_URL, CoreBackendService } from './backend/core';
interface IMapping {
  from: string;
  to: string;
}
interface ILocalWxServerConfig {
  port: number;
  getMappings: () => Promise<IMapping[]>;
  backend: CoreBackendService;
}

export interface IDebugAuth {
  appid: string;
  openid: string;
  unionid?: string;
  appuin?: string;
  useruin?: string;
  secretid: string;
  secretkey: string;
  token: string;
  expired_time: string;
  qbase_ticket: string;
  clientip: string;
  clientipv6: string;
  cloudbaseaccesstoken: string;
}

const mountPath = path.join(os.homedir(), '.wxcloudbase', '.tencentcloudbase');
// standalone wx-server implementation
// using cli backend
export class LocalWxServer {
  config: ILocalWxServerConfig;
  proxy: ReturnType<typeof createProxyServer>;
  ee: EventEmitter;
  server: http.Server;
  intervalHandler: NodeJS.Timeout;
  port: string;
  mounts: { type: string; path: string }[] = [];
  debugAuth: IDebugAuth | undefined;

  constructor(config: ILocalWxServerConfig) {
    this.config = config;
    // ensure mountPath is available
    fse.ensureDir(mountPath);

    // register interval handler
    this.intervalHandler = setInterval(() => {
      this.updateDebugAuth();
    }, 1000 * 60 * 10);
    // eager update
    this.updateDebugAuth();

    const server = http.createServer(async (req, res) => {
      let mappings: IMapping[];
      try {
        mappings = await config.getMappings();
      } catch (e) {
        res.statusCode = 500;
        res.end(`system error: getMappings failed: ${e}`);
        return;
      }

      try {
        // lazy update
        await this.updateDebugAuth();
      } catch (e) {
        res.statusCode = 500;
        res.end(
          `system error: getDebugAuth failed: ${e}. please check your AppID and CLI Token in vscode extension settings.`
        );
        return;
      }

      const reqService = req.headers['x-wx-service'] || '';
      // find best mapping from header
      const target = mappings.find(m => reqService === m.from) || mappings[0];
      if (target) {
        try {
          await this.proxyCallContainer(req, res, target);
        } catch (e) {
          res.statusCode = 500;
          res.end(`system error: proxy call container failed: ${e}`);
        }
        return;
      }
      res.statusCode = 404;
      res.end(
        `route not found, target is ${JSON.stringify(target)}, available mappings: ${JSON.stringify(
          mappings
        )}`
      );
    });

    this.ee = new EventEmitter();

    server.on('error', e => {
      this.ee?.emit('error', e);
      console.log('[wx-server] error', e);
    });
    this.server = server;
  }
  listen() {
    return new Promise<void>(resolve => {
      this.server.on('listening', () => {
        const { port } = this.server.address() as any;
        this.port = port;
        this.mounts.push({
          type: '.tencentcloudbase',
          path: mountPath
        });
        ext.wxServerInfo = {
          port,
          mounts: this.mounts
        };
        console.warn(`local wxserver listening local at :${port}`);
        resolve();
      });
      this.server.listen(this.config.port, 'localhost');
    });
  }
  close() {
    this.server.close();
    this.ee.emit('close');
    clearInterval(this.intervalHandler);
  }
  async updateDebugAuth() {
    const expiredTime = +this.debugAuth?.expired_time || 0;
    const currentTime = Date.now() / 1000;
    if (expiredTime > currentTime) {
      console.log('[wx-server] debug auth is still valid, skip update');
      return;
    }
    this.debugAuth = await this.config.backend._invokeWxApi({
      api: '/wxa-dev-qbase/gettcbtoken'
    });
    if (!this.debugAuth.cloudbaseaccesstoken) {
      // no access token, show warning message
      vscode.window
        .showWarningMessage(
          this.config.backend.credientials?.privateKey
            ? '登录失败，请检查设置中 AppID 和 CLI Token 是否正确配置。'
            : '使用带微信身份的云托管调试前，请前往云托管控制台 - 设置 - 全局设置 - CLI 秘钥生成秘钥，并在配置中填入 AppID 和 CLI 秘钥。',
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
    fse.outputFile(
      path.join(mountPath, 'wx', 'cloudbase_access_token'),
      this.debugAuth.cloudbaseaccesstoken,
      'utf8'
    );
  }
  proxyCallContainer(req: http.IncomingMessage, res: http.ServerResponse, mapping: IMapping) {
    if (!this.proxy) {
      this.proxy = createProxyServer({
        target: mapping.to,
        changeOrigin: true
      });
    }
    if (!this.debugAuth) {
      throw new Error('debugAuth is not ready');
    }
    req.headers = {
      ...req.headers,
      'x-wx-appid': this.debugAuth.appid || '',
      'x-wx-unionid': this.debugAuth.unionid || '',
      'x-wx-openid': this.debugAuth.openid || '',
      'x-wx-cloudbase-access-token': this.debugAuth.cloudbaseaccesstoken || '',
      'x-wx-local-debug': '1',
      'x-forwarded-for': this.debugAuth.clientip || this.debugAuth.clientipv6 || ''
    };
    this.proxy.on('proxyRes', (proxyRes, req, res) => {
      res.setHeader('X-WX-LOCAL-DEBUG', '1');
    });
    this.proxy.web(req, res);
  }
}
