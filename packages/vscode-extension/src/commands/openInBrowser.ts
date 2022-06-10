import { cloudbase } from '../core/cloudbase';
import * as vscode from 'vscode';
import ext from '../core/global';
import type { IWXContainerId } from '../types';
import { getConfiguration } from '../configuration/configuration';

export async function browseViaWxServer(node?: IWXContainerId): Promise<void> {
  if (!node) return;

  if (!ext.wxServerInfo?.port) {
    // try to reset backend
    try {
      await ext.backend.ensureDebugServer({
        new: true,
        port: getConfiguration().ports.wx,
      });
      if (!ext.wxServerInfo?.port) {
        throw new Error('wx server not ready after resetting backend');
      }
    } catch (error) {
      console.error(error);
      throw new Error(`本地微信服务启动失败，请检查设置中 CLI Key，环境名称是否正确配置。local wx server not started. please check your config that the cli key and environment name is configured correctly. ${error}`);
    }
  }

  const localContainers = await cloudbase.getContainers();
  const local = localContainers.find(c => c.name === node.name);
  if (!local) {
    throw new Error(`no local container found for '${node.name}'`);
  }

  if (!local.container) {
    throw new Error('local container instance not created yet');
  }

  const uri = vscode.Uri.parse(`http://127.0.0.1:${ext.wxServerInfo.port}`);
  vscode.env.openExternal(uri);
}

export async function browseDirectly(node?: IWXContainerId): Promise<void> {
  if (!node) return;

  const localContainers = await cloudbase.getContainers();
  const local = localContainers.find(c => c.name === node.name);
  if (!local) {
    throw new Error(`no local container found for '${node.name}'`);
  }

  if (!local.container) {
    throw new Error('local container instance not created yet');
  }

  const port = local.container.Ports?.find(info => info.PublicPort);
  if (!port) {
    throw new Error('local container no port created');
  }

  const protocol = port.PrivatePort === 443 ? 'https' : 'http';
  const host = port.IP === '0.0.0.0' ? 'localhost' : port.IP;
  // we should prefer hostPort since there may multiple ports exposed in container.
  const uri = vscode.Uri.parse(`${protocol}://${host}:${local.hostPort || port.PublicPort}`);

  vscode.env.openExternal(uri);
}

