import * as fse from 'fs-extra';
import * as path from 'path';
import * as jsonc from 'jsonc-parser';
import * as vscode from 'vscode';
import { cloudbase } from '../cloudbase';
import type { IContainerConfigJSON, IDebugConfig } from '../../types';
import { updateContainerConfigDirect } from './container';

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

// =============== Debug Config ===============

let debugConfigJsonWatcher: vscode.FileSystemWatcher;
let debugConfig: IDebugConfig;

export async function getDebugConfig(refresh?: boolean) {
  if (debugConfig && !refresh) {
    return clone(debugConfig);
  }
  if (!debugConfigJsonWatcher) {
    lazyWatchDebugConfigJSON();
  }

  const filePath = path.join(
    cloudbase.targetWorkspace.uri.fsPath,
    '.cloudbase/container/debug.json'
  );
  if (!fse.existsSync(filePath)) {
    debugConfig = {
      containers: [],
      config: {}
    };
    await fse.outputFile(filePath, JSON.stringify(debugConfig));
  } else {
    debugConfig = jsonc.parse(await fse.readFile(filePath, 'utf8'));
  }
  return clone(debugConfig);
}

export async function overwriteDebugConfig(config: any) {
  debugConfig = clone(config);
  const filePath = path.join(
    cloudbase.targetWorkspace.uri.fsPath,
    '.cloudbase/container/debug.json'
  );
  await fse.outputFile(filePath, JSON.stringify(debugConfig));
}
export async function updateContainerConfig(config: Record<string, IContainerConfigJSON>) {
  if (!debugConfig) {
    await getDebugConfig();
  }
  if (config) {
    debugConfig.config = config;
  }
  const filePath = path.join(
    cloudbase.targetWorkspace.uri.fsPath,
    '.cloudbase/container/debug.json'
  );
  await fse.outputFile(filePath, JSON.stringify(debugConfig, null, 2));
}
export async function updateContainerId(name: string, containerId?: string, mode?: 'compose') {
  if (!debugConfig) {
    await getDebugConfig();
  }
  const container = debugConfig.containers.find(c => c.name === name);
  if (containerId) {
    if (container) {
      container.mode = mode;
      container.containerId = containerId;
    } else {
      debugConfig.containers.push({
        name,
        containerId,
        domain: '',
        ip: '',
        mode
      });
    }
  } else if (container) {
    delete container.containerId;
  }
  const filePath = path.join(
    cloudbase.targetWorkspace.uri.fsPath,
    '.cloudbase/container/debug.json'
  );
  await fse.outputFile(filePath, JSON.stringify(debugConfig, null, 2));
}

function lazyWatchDebugConfigJSON() {
  if (debugConfigJsonWatcher) {
    debugConfigJsonWatcher.dispose();
  }
  debugConfigJsonWatcher = vscode.workspace.createFileSystemWatcher({
    base: path.join(cloudbase.targetWorkspace.uri.fsPath, '.cloudbase', 'container'),
    pattern: 'debug.json'
  });

  const onChange = async (uri: vscode.Uri) => {
    debugConfig = jsonc.parse(
      Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8')
    );
    if (debugConfig.config) {
      updateContainerConfigDirect(debugConfig.config);
    }
  };

  debugConfigJsonWatcher.onDidCreate(onChange);
  debugConfigJsonWatcher.onDidChange(onChange);
}
