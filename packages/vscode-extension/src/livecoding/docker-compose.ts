/* eslint-disable no-param-reassign */
import * as fse from 'fs-extra';
import * as os from 'os';
import path from 'path';
import { findLastIndex, get, set, uniq } from 'lodash';
import { cloudbase } from '../core/cloudbase';
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';
import { analyzeDockerfile, DevDockerfileElements } from './analyze-dockerfile';
import { detectRepositoryType, RepositoryType } from './detect-repository';
import { dockerfileNodemonTemplate, dockerfileTemplate } from './dockerfile-template';

const DEV_DOCKERFILE_NAME = 'Dockerfile.development';

export function dockerComposeTemplate(
  composeConfig: IDockerComposeConfiguration,
  dockerfilePath: string,
  workdir: string
) {
  const extraVolumes = !composeConfig.extraVolumes
    ? ''
    : composeConfig.extraVolumes.map(item => `- ${item}`).join(os.EOL);

  return `version: '3'
services:
  app:
    build: 
      context: ${composeConfig.context}
      dockerfile: ${dockerfilePath}
    volumes:
      - .:${workdir}
      ${extraVolumes}
    ports:
      - ${composeConfig.localPort}:${composeConfig.remotePort}
    container_name: wxcloud_${composeConfig.name}
    labels:
      - wxPort=${composeConfig.wxPort}
      - hostPort=${composeConfig.localPort}
      - wxcloud=${composeConfig.name}
      - role=container
    environment:
      # 使用本地调试 MySQL 时，需要填入如下环境变量，并启动 MySQL 代理服务
      - MYSQL_USERNAME=
      - MYSQL_PASSWORD=
      - MYSQL_ADDRESS=
networks:
  default:
    external:
      name: wxcb0
`;
}

export async function syncEnvironmentVariableToComposeFile(
  serviceName: string,
  yamlConfig: string
) {
  const containers = await cloudbase.getContainers();
  const container = containers.find(c => c.name === serviceName);
  // parse original yaml, aggresively no type check
  const dockerComposeJson: any = yamlLoad(yamlConfig);
  // insert environment
  set(dockerComposeJson, 'services.app.environment', uniq([
    ...get(dockerComposeJson, 'services.app.environment', []),
    ...Object.entries(container.config.envParams).map(([k, v]) => `${k}=${v}`)
  ]));
  // dump yaml
  return yamlDump(dockerComposeJson);
}

export interface IDockerComposeConfiguration {
  context: string;
  localPort: number;
  remotePort: number;
  wxPort: number;
  name: string;
  tokenVolume?: string;
  extraVolumes?: string[];
  envVariables?: string[];
}

export async function generateDockerComposeAndDockerfileDev(
  dockerfilePath: string,
  composeConfig: IDockerComposeConfiguration
) {
  const repoPath = cloudbase.targetWorkspace.uri.fsPath;
  const composePath = path.join(repoPath, 'docker-compose.yml');
  const dockerfileDevPath = path.join(repoPath, DEV_DOCKERFILE_NAME);
  if (fse.existsSync(composePath) && fse.existsSync(dockerfileDevPath)) {
    // only sync environment variable to docker compose yaml.
    const targetDockerComposeFile = await syncEnvironmentVariableToComposeFile(
      composeConfig.name,
      fse.readFileSync(composePath, { encoding: 'utf8' })
    );
    fse.writeFileSync(composePath, targetDockerComposeFile);
    return;
  }
  if (!fse.existsSync(dockerfilePath)) {
    console.warn('invalid dockerfile path.');
    return;
  }

  const dockerfileContent = fse.readFileSync(dockerfilePath, 'utf-8');
  const elements = analyzeDockerfile(dockerfileContent);
  const type = detectRepositoryType(repoPath);
  correctConfigAndElements(type, composeConfig, elements);

  const nodemonNotNeeded = ['php', 'dotnet'].includes(type);
  if (nodemonNotNeeded) {
    fse.writeFileSync(
      dockerfileDevPath,
      dockerfileTemplate({
        from: elements.fromRaw,
        commands: elements.necessaryCommandsRaw,
        entrypoint: elements.entrypoint
      })
    );
  } else {
    fse.writeFileSync(
      dockerfileDevPath,
      dockerfileNodemonTemplate({
        from: elements.fromRaw,
        commands: elements.necessaryCommandsRaw,
        entrypoint: elements.entrypoint,
        watchDir: elements.workdir,
        watchExt: 'java, js, mjs, json, ts, cs, py, go' // TODO: default watch exts
      })
    );
  }
  // patch envVariables
  const targetDockerComposeFile = await syncEnvironmentVariableToComposeFile(
    composeConfig.name,
    dockerComposeTemplate(composeConfig, DEV_DOCKERFILE_NAME, elements.workdir)
  );
  fse.writeFileSync(composePath, targetDockerComposeFile);
}

function correctConfigAndElements(
  type: RepositoryType,
  composeConfig: IDockerComposeConfiguration,
  elements: DevDockerfileElements
) {
  switch (type) {
    case 'javascript':
      if (!composeConfig.extraVolumes) {
        composeConfig.extraVolumes = [];
      }
      composeConfig.extraVolumes.push(`${elements.workdir}/node_modules`);
      break;
    case 'spring':
      elements.entrypoint = 'mvn -s /app/settings.xml -f /app/pom.xml spring-boot:run'.split(' ');
      break;
    case 'dotnet':
      elements.entrypoint = 'dotnet watch'.split(' ');

      // 去除不必要的编译命令
      // eslint-disable-next-line no-case-declarations
      const index = findLastIndex(elements.necessaryCommandsRaw, command =>
        command.trim().toLowerCase().startsWith('run dotnet publish')
      );
      if (index > 0) {
        elements.necessaryCommandsRaw.splice(index, 1);
      }
      // 增加 ASPNETCORE_URLS 环境变量，确保调试模式的 watch 监听在正确的端口上
      elements.necessaryCommandsRaw.push(
        `ENV ASPNETCORE_URLS http://0.0.0.0:${composeConfig.remotePort}`
      );
      break;
  }
}
