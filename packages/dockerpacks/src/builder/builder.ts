import { Dockerfile, DockerIgnore } from '@dockerfile/file';
import { BuilderContext } from './context';

export interface Builder<P extends string = never> {
  detect(ctx: BuilderContext<P>): Promise<DetectionResult>;
  build(ctx: BuilderContext<P>): Promise<BuildResult>;
}

export interface DetectionResult {
  hit: boolean;
}

export type BuildResult = (dockerfile: Dockerfile, ignore: DockerIgnore) => void;
