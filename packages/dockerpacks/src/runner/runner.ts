import { range } from 'lodash';
import { ServerApi } from '@api/server';
import { Builder, DetectionResult } from '@builder/builder';
import { DockerfileFactory } from '@dockerfile/factory';
import { DockerIgnore } from '@dockerfile/file';
import {
  BuilderContext,
  MessageHandler,
  NullMessageHandler,
  PromptHandler,
  PromptIO
} from '@builder/context';
import {
  BuilderGroup,
  BuilderGroupId,
  DEFAULT_BUILDER_GROUPS,
  extractBuilder,
  getBuilderGroup,
  GetPromptPreConfigTypeByGroupId,
  isBuilderWithOptionalProp
} from '@group/group';

interface DetectionResultItem {
  group: BuilderGroup;
  hitBuilders: number[];
}

export interface BuildGroupForSelection {
  id: string;
  label: string;
}

export type BuildGroupSelectorFn = (groups: BuildGroupForSelection[]) => number | Promise<number>;

export abstract class DockerpacksBase {
  constructor(protected readonly serverApi: ServerApi, protected readonly groups: BuilderGroup[]) {}

  async detect(
    appRoot: string,
    promptIo: PromptIO,
    messageHandler: MessageHandler,
    selectorFn: BuildGroupSelectorFn = results => 0
  ): Promise<DockerpacksBuilder | null> {
    const ctx = new BuilderContext(
      appRoot,
      this.serverApi,
      new PromptHandler(promptIo, messageHandler),
      messageHandler
    );

    const results: DetectionResultItem[] = [];
    for (const group of this.groups) {
      const result = await this.detectImpl(ctx, group);
      if (result) {
        results.push(result);
      }
    }

    if (results.length <= 0) {
      return null;
    }

    const selectedIndex = await selectorFn(
      results.map(item => ({ id: item.group.id, label: item.group.label }))
    );
    if (selectedIndex < 0 || selectedIndex >= results.length) {
      throw new Error('invalid index returned by selectorFn');
    }
    const result = results[selectedIndex];
    return new DockerpacksBuilder(result.group, result.hitBuilders, ctx);
  }

  async detectWithGroup<I extends BuilderGroupId>(
    groupId: I,
    appRoot: string,
    promptIo: PromptIO<GetPromptPreConfigTypeByGroupId<I>>,
    messageHandler: MessageHandler = new NullMessageHandler()
  ): Promise<DockerpacksBuilder | null> {
    const ctx = new BuilderContext(
      appRoot,
      this.serverApi,
      new PromptHandler(promptIo, messageHandler),
      messageHandler
    );

    const group = getBuilderGroup(groupId);
    const result = await this.detectImpl(ctx as BuilderContext, group);
    if (!result) {
      return null;
    }

    return new DockerpacksBuilder(result.group, result.hitBuilders, ctx as BuilderContext);
  }

  protected async detectImpl(
    ctx: BuilderContext,
    group: BuilderGroup
  ): Promise<DetectionResultItem | null> {
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

    if (!hit) {
      return null;
    }

    const hitBuilders = detectionResults
      .map(([result], index) => (result.hit ? index : null))
      .filter(item => item !== null) as number[];
    return {
      group,
      hitBuilders: hitBuilders
    };
  }
}

export class DockerpacksBuilder {
  private disposed = false;

  constructor(
    readonly group: BuilderGroup,
    readonly enabledBuilders: number[],
    private readonly ctx: BuilderContext
  ) {}

  async build(): Promise<DockerpacksBuildResult> {
    if (this.disposed) {
      throw new Error('the instance is already consumed and cannot be called again');
    }

    const dockerIgnore = new DockerIgnore();
    dockerIgnore.append('.git', '.gitignore', '.dockerignore', 'Dockerfile*', 'LICENSE', '*.md');

    const factory = new DockerfileFactory();
    for (const index of this.enabledBuilders) {
      const builder = extractBuilder(this.group.builders[index]);
      try {
        const fn = await builder.build(this.ctx);
        fn(factory.getDockerfile(), dockerIgnore);
      } catch (e: any) {
        if (e instanceof Error) {
          throw new BuildError(this.group, { builder, reason: e }, '构建过程中出错', e);
        } else {
          throw new BuildError(this.group, { builder, reason: e }, '构建过程中出错');
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

export class Dockerpacks extends DockerpacksBase {
  constructor() {
    super(ServerApi.TCB_SHANGHAI, DEFAULT_BUILDER_GROUPS);
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
