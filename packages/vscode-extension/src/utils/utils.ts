import * as vscode from 'vscode';
import * as path from 'path';
import * as Dockerode from 'dockerode';
import ext from '../core/global';
import { cloudbase } from '../core/cloudbase';
import { runDockerCommand } from './terminal';
import type { IWXContainerId, IWXContainerInfo } from '../types.d';
import { getDebugConfig } from 'src/core/config';

export const LOG_OUTPUT = vscode.window.createOutputChannel('Weixin Cloudbase');

export const sleep = (ms = 0) => new Promise(r => setTimeout(r, ms));

export async function invokeDockerode<T>(fn: () => Promise<T>, timeout = 20 * 1000, token?: vscode.CancellationToken): Promise<T> {
  try {
    return await withTimeoutAndCancellationToken(fn, timeout, token);
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error(`Failed to connect. Is Docker installed and running? Error: ${e}`);
    }
    if (e.statusCode === 404 && /no such container/i.test(e.message)) {
      ext.wxContainersProvider.refresh();
    }
    throw e;
  }
}

export async function withTimeoutAndCancellationToken<T>(fn: () => Promise<T>, timeout = 20 * 1000, token?: vscode.CancellationToken): Promise<T> {
  const promises: Promise<T>[] = [fn(), getTimeoutPromise(timeout)];
  if (token) {
    promises.push(getCancelPromise(token));
  }
  return Promise.race(promises);
}

export async function getTimeoutPromise(timeout: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(`timedout (${timeout}ms)`), timeout);
  });
}

export async function getCancelPromise(token: vscode.CancellationToken): Promise<never> {
  return new Promise((_, reject) => {
    const disposable = token.onCancellationRequested(() => {
      disposable.dispose();
      reject(new Error('cancelled'));
    });
  });
}

export function getIconPath(context: vscode.ExtensionContext, iconName: string) {
  return {
    light: context.asAbsolutePath(path.join('resources', 'light', iconName)),
    dark: context.asAbsolutePath(path.join('resources', 'dark', iconName)),
  };
}

interface IGetDockerFilePathResult {
  uri: vscode.Uri
  relativePath: string
}

export async function getDockerContext(info: IWXContainerInfo): Promise<string> {
  // get docker file
  const debugConfig = await getDebugConfig();
  try {
    const containerConfigJson = debugConfig.config[info.name];
    if (containerConfigJson.buildDir) {
      return containerConfigJson.buildDir;
    }
  } catch (e) { /* noop */ }
  return '.';
}

export async function getDockerFilePath(info: IWXContainerInfo): Promise<IGetDockerFilePathResult> {
  // get docker file
  const debugConfig = await getDebugConfig();
  try {
    const containerConfigJson = debugConfig.config[info.name];
    const context = await getDockerContext(info);
    if (containerConfigJson.dockerfilePath) {
      return {
        uri: vscode.Uri.joinPath(info.uri, context, containerConfigJson.dockerfilePath),
        relativePath: containerConfigJson.dockerfilePath,
      };
    }
  } catch (e) { /* noop */ }

  const rootDockerFileUri = vscode.Uri.joinPath(info.uri, 'Dockerfile');
  if (await fileUriExists(rootDockerFileUri)) {
    return {
      uri: rootDockerFileUri,
      relativePath: 'Dockerfile',
    };
  }

  throw new Error('Dockerfile not found');
}

export async function removeHostContainer(name: string, id: string, includeImage = true) {
  // remove old image & old container
  const container = cloudbase.dockerode.getContainer(id);
  const inspectInfo = await container.inspect();

  let image: Dockerode.Image;
  if (includeImage) {
    image = cloudbase.dockerode.getImage(inspectInfo.Image);
  }

  await runDockerCommand({
    command: `docker container rm -f ${container.id}`,
    name,
  });

  await runDockerCommand({
    command: `docker container rm -f ${container.id}`,
    name,
  });

  await runDockerCommand({
    command: `docker image rm -f ${image.id}`,
    name,
  });

  // if (inspectInfo.State.Running) {
  //   await container.stop()
  // } else {
  //   await container.remove()
  // }

  // if (image) {
  //   await image.remove()
  // }
}

export async function getHostContainerByContainerID(objectId: IWXContainerId): Promise<Dockerode.ContainerInfo> {
  if (objectId.type === 'local') {
    const localContainers = await cloudbase.getContainers();
    const local = localContainers.find(c => c.name === objectId.name);
    return local?.container;
  }
  // proxy
  const list = await withTimeoutAndCancellationToken(() => cloudbase.dockerode.listContainers({
    all: true,
  }));
  const proxy = list.find(c => c.Labels?.wxcloud === objectId.name || c.Labels?.wxcloud === objectId.ip);
  if (!proxy) {
    throw new Error('proxy container instance not created yet');
  }
  return proxy;
}

export async function fileUriExists(uri: vscode.Uri): Promise<Boolean> {
  return new Promise<Boolean>(resolve => {
    return vscode.workspace.fs.stat(uri).then(() => resolve(true), () => resolve(false));
  });
}

/*

commands to show view:

workbench.view.extensions.resetViewContainerLocation
workbench.view.remote.resetViewContainerLocation
workbench.view.scm.resetViewContainerLocation
workbench.view.extension.test.resetViewContainerLocation
workbench.view.debug.resetViewContainerLocation
workbench.view.explorer.resetViewContainerLocation
workbench.view.search.resetViewContainerLocation
workbench.view.search.toggleVisibility
workbench.view.search.removeView
workbench.view.extensions
workbench.view.remote
workbench.view.scm
workbench.view.testing.focus
workbench.view.testing.resetViewLocation
workbench.view.extension.test
workbench.view.debug
workbench.view.explorer
workbench.view.search
workbench.view.search.focus
workbench.view.search.resetViewLocation
workbench.views.extensions.installed.empty.focus
workbench.views.extensions.installed.empty.resetViewLocation
workbench.views.extensions.installed.focus
workbench.views.extensions.installed.resetViewLocation
workbench.views.extensions.popular.focus
workbench.views.extensions.popular.resetViewLocation
workbench.views.extensions.enabled.focus
workbench.views.extensions.enabled.resetViewLocation
workbench.views.extensions.disabled.focus
workbench.views.extensions.disabled.resetViewLocation
workbench.views.extensions.marketplace.focus
workbench.views.extensions.marketplace.resetViewLocation
workbench.views.extensions.searchInstalled.focus
workbench.views.extensions.searchInstalled.resetViewLocation
workbench.views.extensions.searchEnabled.focus
workbench.views.extensions.searchEnabled.resetViewLocation
workbench.views.extensions.searchDisabled.focus
workbench.views.extensions.searchDisabled.resetViewLocation
workbench.views.extensions.searchOutdated.focus
workbench.views.extensions.searchOutdated.resetViewLocation
workbench.views.extensions.searchBuiltin.focus
workbench.views.extensions.searchBuiltin.resetViewLocation
workbench.views.extensions.workspaceRecommendations.focus
workbench.views.extensions.workspaceRecommendations.resetViewLocation
workbench.views.extensions.otherRecommendations.focus
workbench.views.extensions.otherRecommendations.resetViewLocation
workbench.views.extensions.builtinFeatureExtensions.focus
workbench.views.extensions.builtinFeatureExtensions.resetViewLocation
workbench.views.extensions.builtinThemeExtensions.focus
workbench.views.extensions.builtinThemeExtensions.resetViewLocation
workbench.views.extensions.builtinProgrammingLanguageExtensions.focus
workbench.views.extensions.builtinProgrammingLanguageExtensions.resetViewLocation
workbench.view.sync.resetViewContainerLocation
workbench.view.sync
workbench.views.sync.merges.focus
workbench.views.sync.merges.resetViewLocation
workbench.views.sync.remoteActivity.focus
workbench.views.sync.remoteActivity.resetViewLocation
workbench.views.sync.machines.focus
workbench.views.sync.machines.resetViewLocation
workbench.views.sync.localActivity.focus
workbench.views.sync.localActivity.resetViewLocation
workbench.view.extension.references-view.resetViewContainerLocation
workbench.view.extension.references-view
workbench.view.extension.flutter.resetViewContainerLocation
workbench.view.extension.flutter
workbench.view.extension.latex.resetViewContainerLocation
workbench.view.extension.latex
workbench.view.extension.sftp.resetViewContainerLocation
workbench.view.extension.sftp
workbench.view.extension.dockerView.resetViewContainerLocation
workbench.view.extension.dockerView

*/


/*

commands to focus on a specific sub-view:

dockerContainers.focus
dockerImages.focus
wxContainers.focus

*/


