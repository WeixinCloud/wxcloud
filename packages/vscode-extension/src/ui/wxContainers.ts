import * as vscode from 'vscode';
import { throttle } from 'lodash';
import * as Dockerode from 'dockerode';
import { cloudbase } from '../core/cloudbase';
import { invokeDockerode as $, getIconPath } from '../utils/utils';
import { DockerStatusToIconName } from '../utils/const';
import ext from '../core/global';
import { getConfiguration } from '../configuration/configuration';
import type { IWXContainerId, IWXContainerInfo } from '../types';
import { ensureRemoteProxySetup } from '../core/image';
export class WXContainersProvider implements vscode.TreeDataProvider<IWXContainerId> {
  public onDidChangeTreeDataEmitter: vscode.EventEmitter<IWXContainerId | null> =
    new vscode.EventEmitter<IWXContainerId | null>();
  readonly onDidChangeTreeData: vscode.Event<IWXContainerId | null> =
    this.onDidChangeTreeDataEmitter.event;

  localContainers: IWXContainerInfo[] = [];
  hostList: Dockerode.ContainerInfo[] = [];

  readonly credentialsId: IWXContainerId = {
    type: 'credentials',
    name: 'Important: Enter MiniProgram AppID and CLI Key'
  };

  readonly runningFolderId: IWXContainerId = {
    type: 'running',
    name: 'Running Containers',
    folder: true
  };

  readonly localFolderId: IWXContainerId = {
    type: 'local',
    name: 'Local Containers',
    folder: true
  };

  readonly proxyFolderId: IWXContainerId = {
    type: 'proxy',
    name: 'Proxy nodes for VPC access',
    folder: true
  };

  private editor: vscode.TextEditor;
  private autoRefresh = true;
  private refreshAll = throttle(
    this.onDidChangeTreeDataEmitter.fire.bind(this.onDidChangeTreeDataEmitter, undefined),
    500
  );
  private firstTimeEnsureRemoteProxy = true;

  // readonly debugServerFolderId: IWXContainerId = {
  // 	type: 'debugServer',
  // 	name: 'Debug Server Info',
  // 	folder: true,
  // }

  constructor(private context: vscode.ExtensionContext) {}

  refresh(objectId?: IWXContainerId): void {
    if (objectId) {
      this.onDidChangeTreeDataEmitter.fire(objectId);
    } else {
      this.refreshAll();
    }
  }

  async getChildren(objectId?: IWXContainerId): Promise<IWXContainerId[]> {
    const configuration = getConfiguration();

    if (!objectId) {
      if (process.env.WX_ENV_PUBLIC && (!configuration.appid || !configuration.cliKey)) {
        return [this.credentialsId, this.localFolderId, this.proxyFolderId];
      }
      if (process.env.WX_ENV_IDE) {
        return [this.runningFolderId, this.localFolderId, this.proxyFolderId];
      }
      return [this.localFolderId, this.proxyFolderId];
    }

    if (!objectId.folder) {
      return Promise.resolve([]);
    }
    if (objectId.type === 'local') {
      const list = await cloudbase.getContainers(true);
      this.localContainers = list;
      return list.map(c => ({
        type: 'local',
        name: c.name,
        mode: c.mode
      }));
    }
    if (objectId.type === 'proxy') {
      this.hostList = await $(() =>
        cloudbase.dockerode.listContainers({
          all: true
        })
      );
      const conf = getConfiguration();

      if (conf.vpcProxyNodes.length && this.firstTimeEnsureRemoteProxy) {
        this.firstTimeEnsureRemoteProxy = false;
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Ensuring Remote VPC Proxy Server'
          },
          async progress => {
            try {
              return await ensureRemoteProxySetup(s => progress.report({ message: s }));
            } catch (e) {
              vscode.window.showErrorMessage(`${e}`);
            }
          }
        );
      }
      const extServices = await this.resolveExtServices();
      return [
        ...conf.vpcProxyNodes.map(
          name =>
            ({
              type: 'proxy',
              name
            } as const)
        ),
        ...extServices.services.map(
          s =>
            ({
              type: 'proxy',
              name: s.name,
              ip: s.ip
            } as const)
        ),
        {
          type: 'proxy',
          name: 'api.weixin.qq.com'
        },
        {
          type: 'proxy',
          name: '+'
        }
      ];
    }
    if (objectId.type === 'debugServer') {
      return [
        {
          type: 'debugServer',
          name: 'port'
        }
      ];
    }
    if (objectId.type === 'running') {
      this.hostList = await $(() =>
        cloudbase.dockerode.listContainers({
          all: true
        })
      );
      const runningContainers = this.hostList
        .filter(c => c.State === 'running')
        .filter(c => c.Labels.wxcloud)
        // we can't attach container without wxPort
        .filter(c => c.Labels.wxPort);
      // if there is no running container, we should detach ide immediately
      if (!runningContainers.length) {
        ext.backend.detachService();
      }
      return runningContainers.map(c => ({
        type: 'running',
        name: c.Labels.wxcloud
      }));
    }
    return Promise.resolve([]);
  }

  getTreeItem(objectId: IWXContainerId): vscode.TreeItem {
    if (objectId.folder) {
      const treeItem: vscode.TreeItem = new vscode.TreeItem(
        objectId.name,
        vscode.TreeItemCollapsibleState.Expanded
      );
      treeItem.iconPath = null;
      treeItem.description = '';
      treeItem.contextValue = this.getContextValue(objectId);
      return treeItem;
    }

    if (objectId.type === 'credentials') {
      const treeItem: vscode.TreeItem = new vscode.TreeItem(
        objectId.name,
        vscode.TreeItemCollapsibleState.None
      );
      treeItem.iconPath = getIconPath(this.context, 'warning.svg');
      treeItem.description = '';
      treeItem.contextValue = '';
      treeItem.command = {
        command: 'wxContainers.openConfiguration',
        title: ''
      };
      return treeItem;
    }

    if (objectId.type === 'debugServer') {
      const treeItem: vscode.TreeItem = new vscode.TreeItem(
        objectId.name,
        vscode.TreeItemCollapsibleState.None
      );
      treeItem.iconPath = null;
      treeItem.description = this.getDescription(objectId);
      treeItem.contextValue = '';
      return treeItem;
    }

    if (objectId.type === 'proxy' && objectId.name === '+') {
      const treeItem: vscode.TreeItem = new vscode.TreeItem(
        objectId.name,
        vscode.TreeItemCollapsibleState.None
      );
      treeItem.iconPath = null;
      treeItem.description = '';
      treeItem.contextValue = 'proxy_Add';
      treeItem.command = {
        command: 'wxContainers.addProxyNode',
        title: 'Enter hostname:port or ip:port (eg. www.qq.com:80 or 10.0.0.1:3000)'
      };
      return treeItem;
    }

    const treeItem: vscode.TreeItem = new vscode.TreeItem(
      objectId.name,
      vscode.TreeItemCollapsibleState.None
    );
    treeItem.iconPath = this.getIcon(objectId);
    treeItem.description = this.getDescription(objectId);
    treeItem.contextValue = this.getContextValue(objectId);
    return treeItem;
  }

  select(range: vscode.Range) {
    this.editor.selection = new vscode.Selection(range.start, range.end);
  }

  private getIcon(objectId: IWXContainerId): any {
    const container = this.getHostContainerInfo(objectId);
    if (!container) return getIconPath(this.context, 'statusStop.svg');

    const iconName = DockerStatusToIconName[container.State];
    if (!iconName) return null;

    return getIconPath(this.context, `status${iconName}.svg`);
  }

  private async resolveExtServices() {
    const configuration = getConfiguration();
    const extServices = await ext.backend.getExtList({
      appid: configuration.appid,
      envId: configuration.vpcProxyTargetEnvId
    });
    return extServices;
  }

  private getDescription(objectId: IWXContainerId): string {
    if (objectId.type === 'debugServer') {
      if (objectId.name === 'port') {
        return ext.wxServerInfo.port ? `${ext.wxServerInfo.port}` : 'none';
      }
      return '';
    }

    const container = this.getHostContainerInfo(objectId);
    if (!container) return '';

    if (objectId.type === 'local' || objectId.type === 'running') {
      // find a public port if multiple ports are exposed
      const containerPort = container.Ports?.find(info => info.PublicPort)?.PublicPort;
      const wxPort = container.Labels.wxPort || 'none';
      return `${wxPort} - ${containerPort ? `:${containerPort}` : 'none'}`;
    }
    return '';
  }

  private getContextValue(objectId: IWXContainerId): string {
    if (objectId.folder) {
      return `Folder_${objectId.type}`;
    }

    const container = this.getHostContainerInfo(objectId);
    return `${objectId.type}_${container ? container.State : 'Local'}`;
  }

  private getHostContainerInfo(objectId: IWXContainerId) {
    if (objectId.type === 'local') {
      const localContainer = this.localContainers.find(c => c.name === objectId.name);
      return localContainer?.container;
    }
    // proxy
    return this.hostList.find(
      c => c.Labels.wxcloud === objectId.name || c.Labels.wxcloud === objectId.ip
    );
  }
}
