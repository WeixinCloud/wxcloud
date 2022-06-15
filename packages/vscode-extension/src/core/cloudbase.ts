import * as vscode from 'vscode';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import Dockerode from 'dockerode';
import getPort from 'get-port';
import { merge } from 'lodash';
import { invokeDockerode as $ } from '../utils/utils';
import * as config from './config';
import ext from './global';
import type { IWXContainerInfo } from '../types';
import { runDockerCommand } from '../utils/terminal';
import { getDefaultConfig } from './config/container';
import { getConfiguration } from '../configuration/configuration';
import { updateContainerConfig } from './config';

interface IGetCreateContainerArgsResult {
  args: Partial<Dockerode.ContainerCreateOptions>;
  cmd: string;
  hostPort: number;
  containerPort: number;
}

class Cloudbase {
  dockerode: Dockerode;
  projectConfigJsonWatcher?: vscode.FileSystemWatcher;
  containersWatcher?: vscode.FileSystemWatcher;
  cloudcontainerRoot?: string;
  isWorkspaceAsContainer?: boolean;
  containers?: IWXContainerInfo[];
  targetWorkspace: vscode.WorkspaceFolder;

  constructor() {
    this.dockerode = new Dockerode();
    this.getCloudcontainerRoot();
  }

  getCloudcontainerRoot(): string {
    if (this.cloudcontainerRoot || this.isWorkspaceAsContainer) {
      return this.cloudcontainerRoot;
    }

    // detect workspace
    // type A: workspace as container
    getWorkspaceFolders().forEach(p => {
      if (fse.existsSync(path.join(p.uri.fsPath, 'Dockerfile'))) {
        // assume workspace folder is a service
        this.isWorkspaceAsContainer = true;
        this.targetWorkspace = p;
        return;
      }
    });

    // type B: workspace as miniprogram, read project.config.json
    getWorkspaceFolders().forEach(p => {
      const filePath = path.join(p.uri.fsPath, 'project.config.json');
      if (fse.existsSync(filePath)) {
        const json = JSON.parse(fse.readFileSync(filePath, 'utf8'));
        if (!Object.prototype.hasOwnProperty.call(json, 'cloudcontainerRoot')) {
          // throw new Error('missing cloudcontainerRoot in project.config.json');
          return;
        }

        const relativePath = json.cloudcontainerRoot;
        this.cloudcontainerRoot = path.posix.join(p.uri.fsPath, relativePath);
        this.targetWorkspace = p;
        return this.cloudcontainerRoot;
      }
    });

    // if there is no preferred workspace, probe third-party editors
    if (this.targetWorkspace) {
      if (!this.projectConfigJsonWatcher) {
        this.lazyWatchProjectConfigJSON();
      }
    } else {
      if (process.env.WX_ENV_IDE) {
        console.log(
          'no target workspace is available, entering third-party editor integration mode.'
        );
        // eslint-disable-next-line prefer-destructuring
        this.targetWorkspace = vscode.workspace.workspaceFolders[0];
      } else {
        throw new Error(
          '找不到 Dockerfile 或 project.config.json. No Dockerfile or project.config.json not exists'
        );
      }
    }
  }

  async getContainers(refresh?: boolean): Promise<IWXContainerInfo[]> {
    if (this.containers && !refresh) {
      return this.containers;
    }
    if (!this.containersWatcher) {
      this.lazyWatchContainers();
    }

    const cloudcontainerRoot = this.getCloudcontainerRoot();

    const [debugConfig, containerConfigs, localList, hostList] = await Promise.all([
      config.getDebugConfig(refresh),
      config.getContainerConfig(refresh),
      new Promise<IWXContainerInfo[]>((resolve, reject) => {
        if (this.isWorkspaceAsContainer) {
          resolve([
            {
              name: this.targetWorkspace.name.toLowerCase(),
              path: this.cloudcontainerRoot,
              uri: this.targetWorkspace.uri,
              location: 'cloudcontainerRoot'
            }
          ]);
        }
        if (!cloudcontainerRoot) return resolve([]);
        const cloudcontainerRootUri = vscode.Uri.file(cloudcontainerRoot);
        vscode.workspace.fs.readDirectory(cloudcontainerRootUri).then(items => {
          const list: IWXContainerInfo[] = [];
          for (const item of items) {
            if (item[1] === vscode.FileType.Directory && !item[0].startsWith('.')) {
              list.push({
                name: item[0].toLowerCase(),
                path: path.posix.join(cloudcontainerRoot, item[0]),
                uri: vscode.Uri.joinPath(cloudcontainerRootUri, item[0]),
                location: 'cloudcontainerRoot'
              });
            }
          }
          resolve(list);
        }, reject);
      }),
      $(() =>
        cloudbase.dockerode.listContainers({
          all: true
        })
      ),
      this.ensureNetworkBridge()
    ]);

    for (const localInfo of localList) {
      const localConfig = debugConfig.containers.find(c => c.name === localInfo.name);
      if (localConfig?.containerId) {
        const hostInfo = hostList.find(c => c.Id === localConfig.containerId);
        if (hostInfo) {
          localInfo.container = hostInfo;
          localInfo.mode = localConfig.mode;
        } else {
          config.updateContainerId(localConfig.name, '');
        }
      }

      if (containerConfigs[localInfo.name]) {
        localInfo.missingContainerConfigFile = false;
        localInfo.config = merge(getDefaultConfig(), containerConfigs[localInfo.name]);
      } else {
        localInfo.missingContainerConfigFile = true;
        localInfo.config = getDefaultConfig();
      }
    }

    // ext.messenger.invoke('CONTAINERS_UPDATED', {
    //   list: localList,
    // })
    ext.backend.notify({
      type: 'CONTAINERS_UPDATED',
      data: {
        list: localList
      }
    });

    this.containers = localList;
    return this.containers;
  }

  async updateContainerInfo(
    name: string,
    containerInfo?: Dockerode.ContainerInfo,
    mode?: 'compose'
  ) {
    if (!this.containers) {
      await this.getContainers();
    }
    const container = this.containers.find(c => c.name === name);
    if (container) {
      container.container = containerInfo;
    } else {
      if (!this.cloudcontainerRoot) return;
      const cloudcontainerRootUri = vscode.Uri.file(this.cloudcontainerRoot);
      this.containers.push({
        name,
        path: path.posix.join(this.cloudcontainerRoot, name),
        uri: vscode.Uri.joinPath(cloudcontainerRootUri, name),
        container: containerInfo,
        location: 'cloudcontainerRoot'
      });
    }

    await config.updateContainerId(name, containerInfo?.Id, mode);
  }

  async readProjectConfigJSON(): Promise<Record<string, any>> {
    const filePath = path.join(this.targetWorkspace.uri.fsPath, 'project.config.json');
    return JSON.parse(await fse.readFile(filePath, 'utf8'));
  }

  async getCreateContainerArgs(serviceName: string): Promise<IGetCreateContainerArgsResult> {
    const containers = await this.getContainers();
    const container = containers.find(c => c.name === serviceName);
    if (!container) throw new Error(`local container ${serviceName} not found`);

    if (container.missingContainerConfigFile) {
      // prompt init config json
      const { title } = await vscode.window.showWarningMessage(
        '服务目录下缺少指定容器配置的 .cloudbase/container/debug.json（包括容器监听端口等配置），将创建默认配置，可按需修改，确认后手动重试。\nMissing config under service folder, the file is used to specify container options such as listening port. Proceed to create a default config file which you can modify according to your needs, and retry start container manually again.',
        {
          modal: true
        },
        {
          title: 'Confirm'
        },
        {
          title: 'Cancel',
          isCloseAffordance: true
        }
      );

      if (title === 'Cancel') {
        throw new Error('cancelled');
      }

      // create new config file by calling debug
      updateContainerConfig({
        [container.name]: getDefaultConfig()
      });
      // open config file automatically
      await vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.file(
          path.join(this.targetWorkspace.uri.fsPath, '.cloudbase', 'container', 'debug.json')
        )
      );
      // createDefaultConfigFile(vscode.Uri.joinPath(container.uri, 'container.config.json'));
      throw new Error(
        '请配置 debug.json 后重新启动容器。Please configure debug.json and restart container.'
      );
      // throw new Error(`config file not found: ${vscode.Uri.joinPath(container.uri, serviceName, 'container.config.json')}, if file is added, refresh first`)
    }

    const debugConfig = await config.getDebugConfig();
    const containerDebugConfig = debugConfig.containers?.find(c => c.name === serviceName) || {
      name: serviceName
    };

    let cmd = ' --network wxcb0';

    // name
    if (containerDebugConfig.domain) {
      cmd += ` --name ${containerDebugConfig.domain} -l domain=${containerDebugConfig.domain}`;
    } else {
      cmd += ` --name ${`wxcloud_${serviceName}`}`;
    }

    // label
    cmd += ` -l role=container -l wxcloud=${serviceName}`;

    // ip
    if (containerDebugConfig.ip) {
      cmd += ` -l ip=${containerDebugConfig.ip} --ip ${containerDebugConfig.ip}`;
    }

    // port, use configuration if available
    const hostPort = await getPort({
      port: getConfiguration().ports.host
    });

    // we dont care if this port conflict or not since wx server is singleton
    const wxPort = getConfiguration().ports.wx;

    container.hostPort = hostPort;
    const containerPort = container.config.containerPort || 80;

    cmd += ` -l hostPort=${hostPort} -l wxPort=${wxPort}`;

    cmd += ` -p 127.0.0.1:${hostPort}:${containerPort}/tcp`;

    // env
    const env: Dockerode.ContainerCreateOptions['Env'] = [];
    if (container.config.envParams) {
      for (const key of Object.keys(container.config.envParams)) {
        cmd += ` -e '${key}=${container.config.envParams[key]}'`;
        env.push(`${key}=${container.config.envParams[key]}`);
      }
    }

    // cpu mem
    if (container.config.cpu) {
      cmd += ` --cpus ${container.config.cpu}`;
    }
    if (container.config.mem) {
      cmd += ` -m ${container.config.mem}GB`;
    }

    // mounts
    if (ext.wxServerInfo?.mounts) {
      for (const mount of ext.wxServerInfo.mounts) {
        if (mount.type === '.tencentcloudbase') {
          // if host is windows
          if (process.platform === 'win32') {
            try {
              // parse os version
              const [major, minor, _patch] = os.release().split('.').map(Number);
              if (major === 6 && minor === 1) {
                // host is Win7, use legacy mount path form(C:/ -> /c/)
                mount.path = mount.path.replace(/\\/g, '/').replace(/[A-Z]:\//g, (v) => `/${v[0].toLowerCase()}/`)
              }
            } catch (error) {
              console.warn('failed to patch mount path for docker ce(win7)', error);
            }
          }
          cmd += ` --mount type=bind,source="${mount.path}",target=/.tencentcloudbase,readonly`;
        }
      }
    }

    return {
      args: {
        HostConfig: {
          PortBindings: {
            [`${containerPort}/tcp`]: [
              {
                HostPort: hostPort
              }
            ]
          },
          Memory: container.config.mem
          // no option equivalent to --cpus
        },
        Env: env
      },
      cmd,
      hostPort,
      containerPort
    };
  }

  async ensureNetworkBridge() {
    const networks = await $(() => cloudbase.dockerode.listNetworks());
    if (!networks.find(n => n.Name === 'wxcb0')) {
      // await $(() => cloudbase.dockerode.createNetwork({
      //   Name: 'wxcb0',
      //   Driver: 'bridge',
      //   IPAM: {
      //     Driver: 'default',
      //     Options: {},
      //     Config: [{
      //       Subnet: '10.0.0.0/8',
      //     }],
      //   },
      // }))
      await runDockerCommand({
        name: 'init',
        command: 'docker network create --driver=bridge --subnet=10.0.0.0/8 wxcb0'
      });
    }
  }

  lazyWatchProjectConfigJSON() {
    if (this.projectConfigJsonWatcher) {
      this.projectConfigJsonWatcher.dispose();
    }
    this.projectConfigJsonWatcher = vscode.workspace.createFileSystemWatcher({
      base: this.targetWorkspace.uri.fsPath,
      pattern: 'project.config.json'
    });

    const onChange = async () => {
      const json = await this.readProjectConfigJSON();
      if (json.cloudcontainer && json.cloudcontainer !== this.cloudcontainerRoot) {
        this.cloudcontainerRoot = json.cloudcontainer;
        this.lazyWatchContainers();
      }
    };

    this.projectConfigJsonWatcher.onDidCreate(onChange);
    this.projectConfigJsonWatcher.onDidChange(onChange);
  }

  lazyWatchContainers() {
    if (this.containersWatcher) {
      this.containersWatcher.dispose();
    }
    if (!this.targetWorkspace) {
      // headless mode
      return;
    }
    this.containersWatcher = vscode.workspace.createFileSystemWatcher({
      base: this.targetWorkspace.uri.fsPath,
      pattern: '*'
    });

    const onChange = () => ext.wxContainersProvider.refresh();
    this.containersWatcher.onDidCreate(onChange);
    this.containersWatcher.onDidDelete(onChange);
  }
}

export const cloudbase = new Cloudbase();

// let projectConfigJsonWatcher: vscode.FileSystemWatcher
// let containersWatcher: vscode.FileSystemWatcher
// let cloudcontainerRoot: string
// let containers: IWXContainerInfo[]

export function getWorkspaceFolders() {
  // compatible with vscode 1.32
  return vscode.workspace.workspaceFolders;
}
