import { ServerApi } from '@api/server';
import { Builder, DetectionResult } from '@builder/builder';
import { BuilderContext, MessageHandler, PromptHandler, PromptIO } from '@builder/context';
import { DockerfileFactory } from '@dockerfile/factory';
import { DockerIgnore } from '@dockerfile/file';
import { BuilderGroup, extractBuilder, isBuilderWithOptionalProp } from '@runner/group';
import { range } from 'lodash';
import { DEFAULT_BUILDER_GROUPS } from './group';

interface SelectionResult {
  group: BuilderGroup;
  hitBuilders: number[];
}

export interface BuildResult {
  dockerfile: string;
  files: Map<string, string>;
}

export abstract class DockerpacksRunnerBase {
  private ctx: BuilderContext = null!;

  constructor(private readonly serverApi: ServerApi, private readonly groups: BuilderGroup[]) {}

  async run(
    appRoot: string,
    promptIo: PromptIO,
    messageHandler: MessageHandler
  ): Promise<BuildResult | null> {
    this.ctx = new BuilderContext(
      appRoot,
      this.serverApi,
      new PromptHandler(promptIo, messageHandler),
      messageHandler
    );

    const selectionResult = await this.select();
    if (!selectionResult) {
      return null;
    }

    const buildResult = await this.build(selectionResult);
    return buildResult;
  }

  private async select(): Promise<SelectionResult | null> {
    for (const group of this.groups) {
      const tasks = group.builders.map(async builder =>
        isBuilderWithOptionalProp(builder)
          ? ([await builder[0].detect(this.ctx), builder[1]] as const)
          : ([await builder.detect(this.ctx), false] as const)
      );
      const results = await Promise.allSettled(tasks);

      const failed = results.some(r => r.status === 'rejected');
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

  private async build(result: SelectionResult): Promise<BuildResult> {
    const dockerIgnore = new DockerIgnore();
    dockerIgnore.append('.git', '.gitignore', '.dockerignore', 'Dockerfile*', 'LICENSE', '*.md');

    const factory = new DockerfileFactory();
    for (const index of result.hitBuilders) {
      const builder = extractBuilder(result.group.builders[index]);
      try {
        const fn = await builder.build(this.ctx);
        fn(factory.getDockerfile(), dockerIgnore);
      } catch (e: any) {
        if (e instanceof Error) {
          throw new BuildError(result.group, { builder, reason: e }, '构建过程中出错', e);
        } else {
          throw new BuildError(result.group, { builder, reason: e }, '构建过程中出错');
        }
      }
    }

    const dockerfile = factory.build();
    const files = this.ctx.files.writtenFiles;
    files.set('.dockerignore', dockerIgnore.build());

    return { dockerfile, files };
  }
}

export class DockerpacksRunner extends DockerpacksRunnerBase {
  constructor() {
    super(ServerApi.TCB_SHANGHAI, DEFAULT_BUILDER_GROUPS);
  }
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
