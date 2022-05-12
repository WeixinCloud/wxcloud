import { Dockerfile, DockerIgnore } from '@dockerfile/file';
import { BuilderContext } from './context';

export interface Builder {
  detect(ctx: BuilderContext): Promise<DetectionResult>;
  build(ctx: BuilderContext): Promise<BuildResult>;
}

export interface DetectionResult {
  hit: boolean;
}

export type BuildResult = (dockerfile: Dockerfile, ignore: DockerIgnore) => void;
