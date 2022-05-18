import { range } from 'lodash';
import { ServerApi } from '@api/server';
import { Builder, DetectionResult } from '@builder/builder';
import { DockerfileFactory } from '@dockerfile/factory';
import { DockerIgnore } from '@dockerfile/file';
import { BuilderContext, MessageHandler, PromptHandler, PromptIO } from '@builder/context';
import {
  BuilderGroup,
  DEFAULT_BUILDER_GROUPS,
  extractBuilder,
  isBuilderWithOptionalProp
} from '@group/group';

interface SelectionResult {
  group: BuilderGroup;
  hitBuilders: number[];
}

export abstract class DockerpacksBase {
  constructor(private readonly serverApi: ServerApi, private readonly groups: BuilderGroup[]) {}

  async detectBuilders(
    appRoot: string,
    promptIo: PromptIO,
    messageHandler: MessageHandler
  ): Promise<DockerpacksDetectionResult | null> {
    const ctx = new BuilderContext(
      appRoot,
      this.serverApi,
      new PromptHandler(promptIo, messageHandler),
      messageHandler
    );

    const result = await this.select(ctx);
    if (!result) {
      return null;
    }

    return new DockerpacksDetectionResult(result.group, result.hitBuilders, ctx);
  }

  private async select(ctx: BuilderContext): Promise<SelectionResult | null> {
    for (const group of this.groups) {
      const tasks = group.builders.map(async builder =>
        isBuilderWithOptionalProp(builder)
          ? ([await builder[0].detect(ctx), builder[1]] as const)
          : ([await builder.detect(ctx), false] as const)
      );
      const results = await Promise.allSettled(tasks);

      const failed = results.some(item => item.status === 'rejected');
      if (failed) {
        const errors: BuilderError[] = range(0, results.length)
          .filter(i => results[i].status === 'rejected')
          .map(i => ({
            builder: extractBuilder(group.builders[i]),
            reason: (results[i] as PromiseRejectedResult).reason
          }));
        throw new DetectionError(group, errors, '检测过程中出错');
      }

      const detectionResults: [DetectionResult, boolean][] = results.map(
        result => (result as PromiseFulfilledResult<any>).value
      );
      const hit = detectionResults.every(
        ([result, isOptional]) => result.hit || (!result.hit && isOptional)
      );

      if (hit) {
        const hitBuilders = detectionResults
          .map(([result], index) => (result.hit ? index : null))
          .filter(item => item !== null) as number[];
        return {
          group,
          hitBuilders: hitBuilders
        };
      }
    }

    // TODO: should we have a catch-all group?
    return null;
  }
}

export class Dockerpacks extends DockerpacksBase {
  constructor() {
    super(ServerApi.TCB_SHANGHAI, DEFAULT_BUILDER_GROUPS);
  }
}

export class DockerpacksDetectionResult {
  private disposed = false;

  constructor(
    readonly hitGroup: BuilderGroup,
    readonly hitBuilders: number[],
    private readonly ctx: BuilderContext
  ) {}

  async build(): Promise<DockerpacksBuildResult> {
    if (this.disposed) {
      throw new Error('此 DetectionResult 已被消费，不能再被执行');
    }

    const dockerIgnore = new DockerIgnore();
    dockerIgnore.append('.git', '.gitignore', '.dockerignore', 'Dockerfile*', 'LICENSE', '*.md');

    const factory = new DockerfileFactory();
    for (const index of this.hitBuilders) {
      const builder = extractBuilder(this.hitGroup.builders[index]);
      try {
        const fn = await builder.build(this.ctx);
        fn(factory.getDockerfile(), dockerIgnore);
      } catch (e: any) {
        if (e instanceof Error) {
          throw new BuildError(this.hitGroup, { builder, reason: e }, '构建过程中出错', e);
        } else {
          throw new BuildError(this.hitGroup, { builder, reason: e }, '构建过程中出错');
        }
      }
    }

    const dockerfile = factory.build();
    const files = this.ctx.files.writtenFiles;
    files.set('.dockerignore', dockerIgnore.build());

    this.disposed = true;

    return { dockerfile, files };
  }
}

export interface DockerpacksBuildResult {
  dockerfile: string;
  files: Map<string, string>;
}

export interface BuilderError {
  builder: Builder;
  reason: any;
}

export class DetectionError extends Error {
  constructor(readonly group: BuilderGroup, readonly errors: BuilderError[], message: string) {
    super(message);
  }
}

export class BuildError extends Error {
  constructor(
    readonly group: BuilderGroup,
    readonly error: BuilderError,
    message: string,
    cause?: Error
  ) {
    super(message, { cause });
  }
}
