import * as vscode from 'vscode';
import * as jsonc from 'jsonc-parser';
import { cloudbase } from '../cloudbase';
import type { IContainerConfigJSON } from '../../types';
import { getDebugConfig, updateContainerConfig } from './debug';

// let containerConfigJsonWatcher: vscode.FileSystemWatcher;
let containerConfigs: Record<string, IContainerConfigJSON>;

export async function getContainerConfig(refresh?: boolean) {
  if (containerConfigs && !refresh) {
    return containerConfigs;
  }

  const cloudcontainerRoot = await cloudbase.getCloudcontainerRoot();

  // always use new debug.config first
  const debugConfig = await getDebugConfig();
  if (debugConfig.config && Object.keys(debugConfig.config).length > 0) {
    containerConfigs = debugConfig.config;
    return containerConfigs;
  }

  // fallback to legacy config(container.config.json)
  if (cloudbase.isWorkspaceAsContainer) {
    try {
      const configUri = vscode.Uri.joinPath(cloudbase.targetWorkspace.uri, 'container.config.json');
      const json = jsonc.parse(Buffer.from(await vscode.workspace.fs.readFile(configUri)).toString('utf8'));
      containerConfigs = {
        [cloudbase.targetWorkspace.name.toLowerCase()]: json,
      };
      // write containerConfigs into debug config
      updateContainerConfig(containerConfigs);
      // give warning
      vscode.window.showWarningMessage(
        'container.config.json 已自动合并至 .cloudbase/container/debug.config.json，原配置文件将不再生效，请更新 debug.config.json 以使用新的配置。',
      );
    } catch (e) {
      containerConfigs = {};
    }
    return containerConfigs;
  }

  if (!lazyWatchContainerConfigJSON) {
    lazyWatchContainerConfigJSON(cloudcontainerRoot);
  }

  // read all
  if (!cloudcontainerRoot) return;
  const rootUri = vscode.Uri.file(cloudcontainerRoot);
  return new Promise<typeof containerConfigs>((resolve, reject) => {
    vscode.workspace.fs.readDirectory(rootUri).then(async (items) => {
      try {
        const config: Record<string, IContainerConfigJSON> = {};

        for (const item of items) {
          try {
            if (item[1] === vscode.FileType.Directory) {
              const configUri = vscode.Uri.joinPath(rootUri, item[0], 'container.config.json');
              const json = jsonc.parse(Buffer.from(await vscode.workspace.fs.readFile(configUri)).toString('utf8'));
              config[item[0].toLowerCase()] = json;
            }
          } catch (e) {
            // ignore
          }
        }
        containerConfigs = config;
        // write containerConfigs into debug config
        updateContainerConfig(containerConfigs);
        vscode.window.showWarningMessage(
          'container.config.json 已自动合并至 .cloudbase/container/debug.config.json，原配置文件将不再生效，请更新 debug.config.json 以使用新的配置',
        );
        resolve(config);
      } catch (e) {
        reject(e);
      }
    }, reject);
  });
}

export function updateContainerConfigDirect(config: Record<string, IContainerConfigJSON>) {
  // adapter for new debug config
  containerConfigs = config;
}

function lazyWatchContainerConfigJSON(_cloudcontainerRoot: string) {
  // no longer watch
  return;
}

export const getDefaultConfig = (): IContainerConfigJSON => ({
  remark: '',
  dockerfilePath: 'Dockerfile',
  buildDir: '',
  minNum: 0,
  maxNum: 50,
  cpu: 0.5,
  mem: 1,
  policyType: 'cpu',
  policyThreshold: 60,
  envParams: {},
  customLogs: 'stdout',
  containerPort: 80,
  initialDelaySeconds: 2,
});

const DEFAULT_CONFIG_FILE = `// 配置文件格式为 jsonc，支持注释
{
  // Dockerfile 路径
  "dockerfilePath": "Dockerfile",
  // 构建路径
  "buildDir": "",
  // 容器服务监听的端口号
  "containerPort": 80,
  // 环境变量，用字符串 key-value 对表示
  "envParams": {},
  // CPU，单位：核
  "cpu": 0.5,
  // 内存，单位：G
  "mem": 1,
  // 以下配置在本地调试时不起作用
  // 扩缩容依据单位
  "policyType": "cpu",
  // 扩缩容阈值，单位：CPU 百分比
  "policyThreshold": 60,
  // 日志采集方式
  "customLogs": "stdout",
  // 启动检测延迟，单位：秒
  "initialDelaySeconds": 2,
  // 最小实例数
  "minNum": 0,
  // 最大实例数
  "maxNum": 50,
  // 备注
  "remark": ""
}`;

export async function createDefaultConfigFile(uri: vscode.Uri) {
  await vscode.workspace.fs.writeFile(uri, new Uint8Array(Buffer.from(DEFAULT_CONFIG_FILE)));
  vscode.workspace.openTextDocument(uri).then(async (doc) => {
    await vscode.languages.setTextDocumentLanguage(doc, 'jsonc');
    await vscode.window.showTextDocument(doc, 1, false);
  });
}

