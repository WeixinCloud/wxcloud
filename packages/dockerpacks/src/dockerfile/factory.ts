import { NonEmptyArray } from '@utils/types';
import { BuildStage, Dockerfile } from './file';

export type DockerfileEditFn = (dockerfile: Dockerfile) => void;
export type DockerfileInspection = {
  allStages: ReadonlyArray<BuildStage>;
  currentStage: Readonly<BuildStage> | null;
};

const DOCKERFILE_BANNER = `# 由 Dockerpacks 自动生成
# 本 Dockerfile 可能不能完全覆盖您的项目需求，若遇到问题请根据实际情况修改或询问客服`;

export class DockerfileFactory {
  private dockerfile = new Dockerfile();

  inspect(): DockerfileInspection {
    return {
      allStages: this.dockerfile.allStages,
      currentStage: this.dockerfile.currentStage
    };
  }

  getDockerfile() {
    return this.dockerfile;
  }

  build() {
    const result = this.dockerfile.allStages
      .map(stage => stage.commands.map(command => command.serialize()).join('\n\n'))
      .join('\n\n');
    return `${DOCKERFILE_BANNER}\n\n${result}`;
  }
}
