import { Builder } from '@builder/builder';
import { commonEnvBuilder } from '@builder/common/env';
import { commonExposeBuilder } from '@builder/common/expose';
import { golangBuildBuilder } from '@builder/golang/build';
import { golangModuleBuilder } from '@builder/golang/mod';
import { golangRuntimeBuilder } from '@builder/golang/runtime';
import { javaEntrypointBuilder } from '@builder/java/entrypoint';
import { javaGradleBuilder } from '@builder/java/gradle';
import { javaMavenBuilder } from '@builder/java/maven';
import { buildBuilder } from '@builder/node/build';
import { nodeEntrypointBuilder } from '@builder/node/entrypoint';
import { npmBuilder } from '@builder/node/npm';
import { pnpmBuilder } from '@builder/node/pnpm';
import { nodeRuntimeBuilder } from '@builder/node/runtime';
import { svelteKitStaticBuilder } from '@builder/node/sveltekit-static';
import { yarnBuilder } from '@builder/node/yarn';
import { phpComposerBuilder } from '@builder/php/composer';
import { phpEntrypointBuilder } from '@builder/php/entrypoint';
import { phpExtensionsBuilder } from '@builder/php/extensions';
import { phpFpmBuilder } from '@builder/php/fpm';
import { laravelBuilder } from '@builder/php/laravel';
import { nginxBuilder } from '@builder/php/nginx';
import { thinkPhpBuilder } from '@builder/php/thinkphp';
import { pipBuilder } from '@builder/python/pip';
import { pythonRuntimeBuilder } from '@builder/python/runtime';
import { pythonEntrypointBuilder } from '@builder/python/entrypoint';
import { DeepReadonly } from '@utils/types';

export type BuilderGroupType = typeof BUILDER_GROUPS[number]['type'];
export type BuilderGroupId = typeof BUILDER_GROUPS[number]['id'];
export type BuilderWithOptionalProp<P extends string> = [builder: Builder<P>, optional: boolean];

type GetBuilderGroupType<
  I extends BuilderGroupId,
  A extends readonly { id: string; builders: readonly any[] }[] = typeof BUILDER_GROUPS
> = I extends A[0]['id']
  ? A[0]
  : [...A] extends [infer _, ...infer Rest]
  ? Rest extends readonly { id: string; builders: readonly any[] }[]
    ? GetBuilderGroupType<I, Rest>
    : never
  : never;
type GetPromptIdsType<A extends { builders: readonly any[] }> = A['builders'][0] extends
  | Builder<infer S>
  | readonly [Builder<infer S>, ...infer _]
  ? [...A['builders']] extends [infer _, ...infer Rest]
    ? GetPromptIdsImpl<Rest, S>
    : S
  : never;
type GetPromptIdsImpl<A extends any[], P extends string> = A[0] extends
  | Builder<infer S>
  | readonly [Builder<infer S>, ...infer _]
  ? A extends [infer _, ...infer Rest]
    ? GetPromptIdsImpl<Rest, S | P>
    : P
  : P;

export interface BuilderGroup<P extends string = string> {
  type: BuilderGroupType;
  id: BuilderGroupId;
  label: string;
  builders: Array<Builder<P> | BuilderWithOptionalProp<P>>;
}

export function extractBuilder<P extends string>(
  input: Builder<P> | BuilderWithOptionalProp<P>
): Builder {
  if (isBuilderWithOptionalProp(input)) {
    return input[0];
  }
  return input;
}

export function isBuilderWithOptionalProp<P extends string>(
  input: Builder<P> | BuilderWithOptionalProp<P>
): input is BuilderWithOptionalProp<P> {
  return Array.isArray(input);
}

export function getBuilderGroup<I extends BuilderGroupId>(id: I) {
  const result = BUILDER_GROUPS.find(group => group.id === id);
  if (!result) {
    throw new Error('invalid group id');
  }
  return result as unknown as BuilderGroup<GetPromptIdsType<GetBuilderGroupType<I>>>;
}

const BUILDER_GROUPS = [
  {
    type: 'golang',
    id: 'golang.default',
    label: 'Golang 默认构造器',
    builders: [
      golangRuntimeBuilder,
      commonEnvBuilder,
      golangModuleBuilder,
      golangBuildBuilder,
      commonExposeBuilder
    ]
  },
  {
    type: 'java',
    id: 'java.maven',
    label: 'Java Maven 构造器',
    builders: [javaMavenBuilder, commonEnvBuilder, commonExposeBuilder, javaEntrypointBuilder]
  },
  {
    type: 'java',
    id: 'java.gradle',
    label: 'Java Gradle 构造器',
    builders: [javaGradleBuilder, commonEnvBuilder, commonExposeBuilder, javaEntrypointBuilder]
  },
  {
    type: 'node',
    id: 'node.pnpm_with_build',
    label: 'Node pnpm 构造器（含 build 阶段）',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      pnpmBuilder,
      buildBuilder,
      nodeEntrypointBuilder,
      commonExposeBuilder
    ]
  },
  {
    type: 'node',
    id: 'node.pnpm',
    label: 'Node pnpm 构造器',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      pnpmBuilder,
      nodeEntrypointBuilder,
      commonExposeBuilder
    ]
  },
  {
    type: 'node',
    id: 'node.yarn_with_build',
    label: 'Node yarn 构造器（含 build 阶段）',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      yarnBuilder,
      buildBuilder,
      nodeEntrypointBuilder,
      commonExposeBuilder
    ]
  },
  {
    type: 'node',
    id: 'node.yarn',
    label: 'Node yarn 构造器',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      yarnBuilder,
      nodeEntrypointBuilder,
      commonExposeBuilder
    ]
  },
  {
    type: 'node',
    id: 'node.npm_with_build',
    label: 'Node npm 构造器（含 build 阶段）',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      npmBuilder,
      buildBuilder,
      nodeEntrypointBuilder,
      commonExposeBuilder
    ]
  },
  {
    type: 'node',
    id: 'node.npm',
    label: 'Node npm 构造器',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      npmBuilder,
      nodeEntrypointBuilder,
      commonExposeBuilder
    ]
  },
  {
    type: 'node',
    id: 'node.universal',
    label: 'Node 通用构造器',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      nodeEntrypointBuilder,
      commonExposeBuilder
    ]
  },
  {
    type: 'php',
    id: 'php.thinkphp',
    label: 'PHP ThinkPHP 构造器',
    builders: [
      phpFpmBuilder,
      commonEnvBuilder,
      phpExtensionsBuilder,
      nginxBuilder,
      [phpComposerBuilder, true],
      thinkPhpBuilder,
      phpEntrypointBuilder,
      commonExposeBuilder
    ]
  },
  {
    type: 'php',
    id: 'php.laravel',
    label: 'PHP Laravel 构造器',
    builders: [
      phpFpmBuilder,
      commonEnvBuilder,
      phpExtensionsBuilder,
      nginxBuilder,
      [phpComposerBuilder, true],
      laravelBuilder,
      phpEntrypointBuilder,
      commonExposeBuilder
    ]
  },
  {
    type: 'php',
    id: 'php.universal',
    label: 'PHP 通用构造器',
    builders: [
      phpFpmBuilder,
      commonEnvBuilder,
      phpExtensionsBuilder,
      nginxBuilder,
      [phpComposerBuilder, true],
      phpEntrypointBuilder,
      commonExposeBuilder
    ]
  },
  {
    type: 'python',
    id: 'python.universal',
    label: 'Python 通用构造器',
    builders: [
      pythonRuntimeBuilder,
      commonEnvBuilder,
      pipBuilder,
      pythonEntrypointBuilder,
      commonExposeBuilder
    ]
  }
] as const;

const __type__check__: DeepReadonly<BuilderGroup<any>[]> = BUILDER_GROUPS;

export const DEFAULT_BUILDER_GROUPS: BuilderGroup<any>[] = BUILDER_GROUPS as any;
