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
export type BuilderWithOptionalProp = [builder: Builder, optional: boolean];
export interface BuilderGroup {
  type: BuilderGroupType;
  id: BuilderGroupId;
  label: string;
  builders: Array<Builder | BuilderWithOptionalProp>;
}

export function extractBuilder(input: Builder | BuilderWithOptionalProp): Builder {
  if (isBuilderWithOptionalProp(input)) {
    return input[0];
  }
  return input;
}

export function isBuilderWithOptionalProp(
  input: Builder | BuilderWithOptionalProp
): input is BuilderWithOptionalProp {
  return Array.isArray(input);
}

export function getBuilderGroup(id: BuilderGroupId): BuilderGroup | null {
  return (BUILDER_GROUPS.find(group => group.id === id) as any) ?? null;
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

const __type__check__: DeepReadonly<BuilderGroup[]> = BUILDER_GROUPS;

export const DEFAULT_BUILDER_GROUPS: BuilderGroup[] = BUILDER_GROUPS as any;
