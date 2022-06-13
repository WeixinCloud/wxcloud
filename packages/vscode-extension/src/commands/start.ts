import * as vscode from 'vscode';
import * as REGEXP from '../utils/regexp';
import { cloudbase } from '../core/cloudbase';
import {
  getDockerContext,
  getDockerFilePath,
  invokeDockerode as $,
  removeHostContainer
} from '../utils/utils';
import ext from '../core/global';
import { getConfiguration, getProxyTargetEnvId } from '../configuration/configuration';
import { ensureRemoteProxySetup } from '../core/image';
import { runDockerCommand } from '../utils/terminal';
import type { IWXContainerId } from '../types';
import * as Dockerode from 'dockerode';

export enum SupportedDebugType {
  Node,
  Python
}

export async function start(
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
            return await startOne(progress, n, buildImage);
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
export async function debug(
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
            // ask user about debug type
            const debugType = await vscode.window.showQuickPick(['Node', 'Python'], {
              placeHolder: 'Select debug type'
            });
            if (!debugType) {
              return;
            }
            switch (debugType) {
              case 'Node':
                return startOne(progress, n, buildImage, SupportedDebugType.Node);
              case 'Python':
                return startOne(progress, n, buildImage, SupportedDebugType.Python);
            }
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
  buildImage?: boolean,
  debug?: SupportedDebugType
): Promise<void> {
  if (!node) {
    throw new Error('no node selected');
  }

  if (node.type === 'local') {
    return startOneLocal(progress, node, buildImage, debug);
  }
  if (node.type === 'proxy') {
    if (node.name === 'api.weixin.qq.com') {
      return startAgent(progress);
    }
    return startOneProxy(progress, node);
  }
  throw new Error(`unknown node type ${node.type}`);
}

async function startOneLocal(
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  node: IWXContainerId,
  buildImage?: boolean,
  debug?: SupportedDebugType
): Promise<void> {
  const p = (message: string) => progress.report({ message });

  const localContainers = await cloudbase.getContainers();
  const local = localContainers.find(c => c.name === node.name);
  if (!local) {
    throw new Error(`no local container found for '${node.name}'`);
  }

  const imageTag = `wxcloud_${local.name}:latest`;
  if (buildImage || !local.container) {
    if (local.container) {
      // remove old image & old container
      p('cleaning old container and image');
      await removeHostContainer(local.name, local.container.Id);
      cloudbase.updateContainerInfo(local.name);
    }

    // remove container of conflicting name
    const hostContainers = await $(() =>
      cloudbase.dockerode.listContainers({
        all: true
      })
    );
    const conflictNameContainer = hostContainers.find(c => c.Labels.wxcloud === local.name);
    if (conflictNameContainer) {
      p(`cleaning old container and image wcloud_${local.name}`);
      await removeHostContainer(local.name, conflictNameContainer.Id);
    }

    // build image
    p('building image');
    const context = await getDockerContext(local);
    const dockerFileRelativePath = (await getDockerFilePath(local)).relativePath;
    await runDockerCommand({
      command: `docker build -f "${dockerFileRelativePath}" -t ${imageTag} ${context}`,
      name: local.name,
      cwd: local.path,
      rejectOnExitCode: true
    });

    // @deprecated
    // leave these code here for reference only.
    //
    // const buildStream = await cloudbase.dockerode.buildImage(tar.c({
    //   gzip: true,
    //   cwd: local.path,
    // }, fs.readdirSync(local.path)), {
    //   t: imageTag,
    //   dockerfile: (await getDockerFilePath(local)).relativePath,
    // })
    // const buildResult = await new Promise((resolve, reject) => {
    //   cloudbase.dockerode.modem.followProgress(buildStream, (err, res) => err ? reject(err) : resolve(res), (latestProgress: any) => {
    //     if (latestProgress.stream) {
    //       p(`building image: ${latestProgress.stream}`)
    //     }
    //   })
    // })
    // console.warn(buildResult)

    // prepare createContainer args
    const { cmd } = await cloudbase.getCreateContainerArgs(local.name);

    // create and start container
    p('starting container');

    await runDockerCommand({
      command: debug
        ? `docker run --rm -d -p "9229:9229" sh ${cmd} ${imageTag}`
        : `docker run --rm -d ${cmd} ${imageTag}`,
      name: local.name,
      rejectOnExitCode: true
    });

    // update debug info
    await $(() =>
      cloudbase.dockerode.listContainers({
        all: true
      })
    ).then(async list => {
      const info = list.find(c => c.Labels.wxcloud === local.name);
      if (info) {
        await cloudbase.updateContainerInfo(local.name, info);
        ext.wxContainersProvider.refresh();
      }
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

async function startAgent(
  progress: vscode.Progress<{ message?: string; increment?: number }>
): Promise<void> {
  const p = (message: string) => progress.report({ message });
  const nodeName = 'api.weixin.qq.com';

  const imageUri = 'ccr.ccs.tencentyun.com/tcb_prd/openapi-agent:debug';
  const remoteProxyInfo = await ensureRemoteProxySetup(p);
  const list = await $(() =>
    cloudbase.dockerode.listContainers({
      all: true
    })
  );

  checkConflictLocalContainer(list, nodeName);
  const containerInfo = list.find(
    c => c.Labels.role === 'vpcdebugproxy' && c.Labels.wxcloud === nodeName
  );

  if (!containerInfo) {
    let args = '--rm -d --network wxcb0';
    args += ' --pull=always';
    args += ' --name api.weixin.qq.com';
    const envId = getProxyTargetEnvId();
    args += ` -e CBR_ENV_ID=${envId}`;
    args +=
      ` -e TOAL_SERVER=${remoteProxyInfo.domain}:443` +
      ` -e TOAL_KEY=${remoteProxyInfo.key}` +
      ` -l domain=${nodeName}` +
      ' -l role=vpcdebugproxy' +
      ` -l wxcloud=${nodeName}`;

    if (ext.wxServerInfo?.mounts) {
      for (const mount of ext.wxServerInfo.mounts) {
        if (mount.type === '.tencentcloudbase') {
          args += ` --mount type=bind,source="${mount.path}",target=/.tencentcloudbase,readonly`;
        }
      }
    }

    // create and start container
    p('starting container');
    await runDockerCommand({
      command: `docker run ${args} ${imageUri}`,
      name: nodeName,
      rejectOnExitCode: true
    });

    ext.wxContainersProvider.refresh();
  } else {
    // start or restart
    const container = cloudbase.dockerode.getContainer(containerInfo.Id);

    const inspectInfo = await container.inspect();
    if (inspectInfo.State.Running) {
      p('restarting container');
      return $(() => container.restart());
    }

    p('starting container');
    return $(() => container.start());
  }
}

function checkConflictLocalContainer(list: Dockerode.ContainerInfo[], nodeName: string) {
  const conflictingLocalContainer = list.find(
    c => c.Labels.role === 'container' && c.Labels.domain === nodeName
  );
  if (conflictingLocalContainer) {
    // local container already take up the place
    throw new Error(
      `local container ${conflictingLocalContainer.Labels.wxcloud} already started with the same domain/ip, no need to add a proxy`
    );
  }
}

async function startOneProxy(
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  node: IWXContainerId
): Promise<void> {
  const p = (message: string) => progress.report({ message });

  // const proxyImageInfo = await ensureProxyImage(p);
  const imageUri = 'ccr.ccs.tencentyun.com/tcb_prd/wxcloud-localdebug-proxy:latest';
  const remoteProxyInfo = await ensureRemoteProxySetup(p);
  const name = node.ip || node.name;

  const list = await $(() =>
    cloudbase.dockerode.listContainers({
      all: true
    })
  );

  checkConflictLocalContainer(list, name);
  const containerInfo = list.find(
    c => c.Labels.role === 'vpcdebugproxy' && c.Labels.wxcloud === name
  );

  if (!containerInfo) {
    // prepare createContainer args
    // const { cmd } = await cloudbase.getCreateContainerArgs(local.name)
    let args = '--rm -d --network wxcb0';

    const [hostname, port = 80] = name.split(':');
    const usingIP = REGEXP.IPv4.test(hostname);
    if (usingIP) {
      args += ` --ip ${hostname}`;
    } else {
      args += ` --name ${hostname}`;
    }

    const conf = getConfiguration();
    // args += ` -p 127.0.0.1:${port}:${port}/tcp`
    args += ' --pull=always';
    args +=
      `${
        ' -e TOAL_ROLE=client' +
        ` -e TOAL_SERVER=${remoteProxyInfo.domain}:443` +
        ` -e TOAL_KEY=${remoteProxyInfo.key}` +
        ' -e TOAL_SERVER_TIMEOUT=200' +
        ' -e TOAL_MODE=shortpoll' +
        ` -e TOAL_LOCAL_PORT=${port}`
      }${conf.proxy ? ` -e TOAL_LOCAL_PROXY=${conf.proxy}` : ''} -e TOAL_TARGET=${name}` +
      ' -e TOAL_VERBOSE=DEBUG' +
      ' -l role=vpcdebugproxy' +
      ` -l wxcloud=${name}` +
      ` -l ${usingIP ? 'ip' : 'domain'}=${hostname}`;

    // create and start container
    p('starting container');
    await runDockerCommand({
      command: `docker run  ${args} ${imageUri}`,
      name: name,
      rejectOnExitCode: true
    });

    ext.wxContainersProvider.refresh();
  } else {
    // start or restart
    const container = cloudbase.dockerode.getContainer(containerInfo.Id);

    const inspectInfo = await container.inspect();
    if (inspectInfo.State.Running) {
      p('restarting container');
      return $(() => container.restart());
    }

    p('starting container');
    return $(() => container.start());
  }
}
