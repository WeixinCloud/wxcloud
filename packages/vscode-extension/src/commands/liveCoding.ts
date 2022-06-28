import * as vscode from 'vscode';
import { cloudbase } from '../core/cloudbase';
import {
  getDockerContext,
  getDockerFilePath,
  invokeDockerode as $,
  LOG_OUTPUT,
  removeHostContainer
} from '../utils/utils';
import ext from '../core/global';
import { getConfiguration } from '../configuration/configuration';
import { runDockerCommand } from '../utils/terminal';
import type { IWXContainerId } from '../types';
import { generateDockerComposeAndDockerfileDev } from '../livecoding/docker-compose';
import getPort from 'get-port';

export async function liveCoding(
  node?: IWXContainerId,
  nodes?: IWXContainerId[],
  buildImage?: boolean
): Promise<void> {
  if (!node && !nodes) return;
  await Promise.all(
    (nodes || [node]).map(n =>
      vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Starting Container' },
        async progress => {
          try {
            return startOne(progress, n, buildImage);
          } catch (e) {
            if (`${e}` === 'cancelled') {
              return;
            }
            vscode.window.showErrorMessage(`start container failed: ${e}`);
          }
        }
      )
    )
  );
}

async function startOne(
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  node?: IWXContainerId,
  buildImage?: boolean
): Promise<void> {
  if (!node) {
    throw new Error('no node selected');
  }

  if (node.type === 'local') {
    return startOneLocal(progress, node, buildImage);
  }
  throw new Error(`unknown node type ${node.type}`);
}

async function startOneLocal(
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  node: IWXContainerId,
  buildImage?: boolean
): Promise<void> {
  const p = (message: string) => progress.report({ message });

  const localContainers = await cloudbase.getContainers();
  const local = localContainers.find(c => c.name === node.name);
  if (!local) {
    throw new Error(`no local container found for '${node.name}'`);
  }
  // const imageTag = `wxcloud_${local.name}:latest`;

  let hostPort = await getPort({
    port: getConfiguration().ports.host
  });

  try {
    hostPort = await generateDockerComposeAndDockerfileDev(
      (
        await getDockerFilePath(local)
      ).uri.fsPath,
      {
        context: await getDockerContext(local),
        localPort: hostPort,
        remotePort: local.config.containerPort,
        name: local.name,
        // tokenVolume: `${ext.wxServerInfo.mounts[0].path}:/.tencentcloudbase`,
        wxPort: getConfiguration().ports.wx
      }
    );
  } catch (e) {
    LOG_OUTPUT.append(`Live Coding 出错: ${e.message}\n${e.stack}`);
    vscode.window
      .showErrorMessage(
        '自动生成 docker-compose.yml 和 Dockerfile.development 失败，请参考官方文档自行建立这些文件。',
        { modal: true },
        { title: '查看官方文档' }
      )
      .then(({ title }) => {
        if (title) {
          vscode.env.openExternal(
            vscode.Uri.parse(
              'https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/debug/dev.html'
            )
          );
        }
      });
    LOG_OUTPUT.show();
    return;
  }

  if (buildImage || !local.container) {
    if (local.container) {
      // remove old image & old container
      p('cleaning old container and image');
      await removeHostContainer(local.name, local.container.Id);
      cloudbase.updateContainerInfo(local.name);
    }
    // always clear
    await runDockerCommand({
      command: 'docker-compose down',
      name: local.name,
      rejectOnExitCode: false
    });
    // build image
    p('building application');
    // const context = await getDockerContext(local);
    // const dockerFileRelativePath = (await getDockerFilePath(local)).relativePath;
    await runDockerCommand({
      command: 'docker-compose build',
      name: local.name,
      cwd: local.path,
      rejectOnExitCode: true
    });

    // prepare createContainer args
    // const { cmd } = await cloudbase.getCreateContainerArgs(local.name);

    // create and start container
    p('starting container');

    let isContainerCreated = false;
    await runDockerCommand({
      command: 'docker-compose up -d',
      name: local.name,
      rejectOnExitCode: false
    });

    // update debug info
    await $(() =>
      cloudbase.dockerode.listContainers({
        all: true
      })
    )
      .then(async list => {
        const info = list.find(c => c.Labels.wxcloud === local.name);
        if (info) {
          if (info.State === 'running') {
            await cloudbase.updateContainerInfo(local.name, info, 'compose');
            ext.wxContainersProvider.refresh();
            hostPort = info.Ports[0]?.PublicPort;
          } else {
            throw new Error('container crashed when starting: ' + info.Status);
          }
        }
      })
      .then(async () => {
        // prompt to open browser
        const url = `http://localhost:${hostPort}`;
        const openBrowser = await vscode.window.showInformationMessage(
          `实时开发已启动，访问地址：${url}`,
          '在浏览器中打开'
        );
        if (openBrowser) {
          await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
        }
      })
      .catch(e => {
        vscode.window.showErrorMessage(
          `实时开发启动失败：${e.message}，可能是容器启动时异常退出，请检查终端输出和 Dockerfile.development。`
        );
      });

    // attach to docker compose(non-blocking)
    runDockerCommand({
      command: 'docker-compose up',
      name: local.name,
      rejectOnExitCode: true
    });

    return;
  }
  const container = cloudbase.dockerode.getContainer(local.container.Id);

  const inspectInfo = await container.inspect();
  if (inspectInfo.State.Running) {
    return $(() => container.restart());
  }

  // start container
  p('starting container');

  return $(() => container.start());
}
