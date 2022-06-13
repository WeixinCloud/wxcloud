import * as vscode from 'vscode';
import * as os from 'os';
import * as child_process from 'child_process';
import * as getProxySettings from 'get-proxy-settings';
import ext from '../core/global';
import { IConfiguration } from '../types';
import getPort from 'get-port';

const configuration: IConfiguration = {
  vpcProxyNodes: [],
  vpcProxyTargetEnvId: '',
  proxy: '',
  appid: '',
  ciKey: '',
  cliKey: '',
  ports: {
    host: 27081,
    wx: 27082
  }
};

const CONFIGURATION_ID = {
  vpcProxyNodes: 'wxcloud.containerDebug.VPC ProxyNodes',
  vpcProxyTargetEnvId: 'wxcloud.containerDebug.VPC ProxyTargetEnvID',
  appid: 'wxcloud.containerDebug.appid',
  ciKey: 'wxcloud.containerDebug.ciKey',
  cliKey: 'wxcloud.containerDebug.cliKey',
  hostPort: 'wxcloud.containerDebug.hostPort',
  wxPort: 'wxcloud.containerDebug.wxPort'
};

export async function setupConfiguration(context: vscode.ExtensionContext) {
  // init
  configuration.vpcProxyNodes = getProxyNodes();
  configuration.vpcProxyTargetEnvId = getProxyTargetEnvId();
  configuration.proxy = await getProxy();
  configuration.appid = getAppID();
  configuration.ciKey = getCIKey();
  configuration.cliKey = getCLIKey();
  configuration.ports = {
    host: getHostPort(),
    wx: await getWxPort()
  };

  // listen
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async e => {
      if (e.affectsConfiguration(CONFIGURATION_ID.vpcProxyNodes)) {
        configuration.vpcProxyNodes = getProxyNodes();
        ext.wxContainersProvider.refresh(ext.wxContainersProvider.proxyFolderId);
      }

      if (e.affectsConfiguration(CONFIGURATION_ID.vpcProxyTargetEnvId)) {
        configuration.vpcProxyTargetEnvId = getProxyTargetEnvId();
      }

      if (e.affectsConfiguration(CONFIGURATION_ID.appid)) {
        configuration.appid = getAppID();
        updateCIProject();
      }

      if (e.affectsConfiguration(CONFIGURATION_ID.ciKey)) {
        configuration.ciKey = getCIKey();
        updateCIProject();
      }

      if (e.affectsConfiguration(CONFIGURATION_ID.cliKey)) {
        configuration.cliKey = getCLIKey();
        updateCIProject();
      }

      if (e.affectsConfiguration('http.proxy')) {
        configuration.proxy = await getProxy();
      }
    })
  );

  process.nextTick(() => {
    updateCIProject();
  });
}

export function getConfiguration() {
  return configuration;
}

function getAppID() {
  return vscode.workspace.getConfiguration().get<string>(CONFIGURATION_ID.appid) || '';
}

function getCIKey() {
  return vscode.workspace.getConfiguration().get<string>(CONFIGURATION_ID.ciKey) || '';
}
function getCLIKey() {
  return vscode.workspace.getConfiguration().get<string>(CONFIGURATION_ID.cliKey) || '';
}

function getHostPort() {
  const port = vscode.workspace.getConfiguration().get<number>(CONFIGURATION_ID.hostPort) || 27081;
  return port;
}

async function getWxPort() {
  const configPort =
    vscode.workspace.getConfiguration().get<number>(CONFIGURATION_ID.wxPort) || 27082;
  // ensure port is not occupied
  const port = await getPort({ port: configPort, host: 'localhost' });
  // since most user use vscode to host wx-server, we don't want to prompt user about port occupied.
  if (port !== configPort && !process.env.WX_ENV_IDE) {
    vscode.window.showWarningMessage(`微信云托管调试端口被占用，将使用端口 ${port}。`);
  }
  return port;
}

function updateCIProject() {
  if (ext.backend.type === 'core') {
    ext.backend.init(configuration.appid, configuration.cliKey);
  }
  ext.wxContainersProvider.refresh();
}

export function getProxyTargetEnvId() {
  return (
    vscode.workspace.getConfiguration().get<string>(CONFIGURATION_ID.vpcProxyTargetEnvId) || ''
  );
}

export function setProxyTargetEnvId(v: string) {
  return vscode.workspace.getConfiguration().update(CONFIGURATION_ID.vpcProxyTargetEnvId, v, true);
}

function getProxyNodes() {
  return (vscode.workspace.getConfiguration().get<string>(CONFIGURATION_ID.vpcProxyNodes) || '')
    .split(';')
    .map(rx => {
      const x = rx.trim();
      const segments = x.split(':').map(a => a.trim());
      if (!x || segments.length > 2 || segments[0] === '') {
        return undefined;
      }
      if (segments.length === 1) {
        return `${x}:80`;
      }
      if (segments[1] === '') {
        return `${x}80`;
      }
      return x;
    })
    .filter(x => x);
}

export function addProxyNode(name: string) {
  const current = (
    vscode.workspace.getConfiguration().get<string>(CONFIGURATION_ID.vpcProxyNodes) || ''
  ).trim();
  vscode.workspace
    .getConfiguration()
    .update(
      CONFIGURATION_ID.vpcProxyNodes,
      `${current}${!current || current.endsWith(';') ? '' : ';'}${name}`,
      true
    );
}

/**
 * 1. get vscode settings
 * 2. get system settings (macOS and Windows only)
 *
 * Note:
 * 1. support only http proxy
 * 1. proxy authentication not supported yet
 */
async function getProxy(): Promise<string | undefined> {
  // get vscode setting
  const vscodeProxySetting = vscode.workspace.getConfiguration().get<string>('http.proxy');
  if (vscodeProxySetting) {
    return vscodeProxySetting;
  }

  try {
    // get system setting
    if (os.platform() === 'darwin') {
      /**
       * example raw output
       *

<dictionary> {
  FTPPassive : 1
  HTTPEnable : 0
  HTTPSEnable : 0
}

<dictionary> {
  FTPPassive : 1
  HTTPEnable : 1
  HTTPPort : 80
  HTTPProxy : example.proxy
  HTTPSEnable : 1
  HTTPSPort : 80
  HTTPSProxy : example.proxy
}

       */
      const str = child_process.execSync('scutil --proxy', { encoding: 'utf8' });
      const settings: Record<string, string> = str
        .split('\n')
        .filter((x, ind, arr) => ind > 0 && ind < arr.length - 1)
        .reduce((obj, str) => {
          const [key, value] = str.split(':').map(x => x.trim());
          obj[key] = value;
          return obj;
        }, {});

      if (settings.HTTPEnable === '1') {
        return `http://${settings.HTTPProxy}:${settings.HTTPPort}`;
      }
    } else if (os.platform() === 'win32') {
      const settings = await getProxySettings.getProxyWindows();
      if (settings?.http) {
        return `http://${settings.http.host}:${settings.http.port}`;
      }
    } else {
      // auto-detect is not supported for linux, yet
    }
  } catch (e) {
    console.error('get system proxy setting error', e);
  }
}
