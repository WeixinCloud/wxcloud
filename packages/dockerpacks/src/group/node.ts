import { commonEnvBuilder } from '@builder/common/env';
import { buildBuilder } from '@builder/node/build';
import { nodeEntrypointBuilder } from '@builder/node/entrypoint';
import { npmBuilder } from '@builder/node/npm';
import { pnpmBuilder } from '@builder/node/pnpm';
import { nodeRuntimeBuilder } from '@builder/node/runtime';
import { svelteKitStaticBuilder } from '@builder/node/sveltekit-static';
import { yarnBuilder } from '@builder/node/yarn';
import { BuilderGroup } from './group';

export const NODE_GROUPS: BuilderGroup[] = [
  {
    type: 'node',
    label: 'Node pnpm 构造器（含 build 阶段）',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      pnpmBuilder,
      buildBuilder,
      nodeEntrypointBuilder
    ]
  },
  {
    type: 'node',
    label: 'Node pnpm 构造器',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      pnpmBuilder,
      nodeEntrypointBuilder
    ]
  },
  {
    type: 'node',
    label: 'Node yarn 构造器（含 build 阶段）',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      yarnBuilder,
      buildBuilder,
      nodeEntrypointBuilder
    ]
  },
  {
    type: 'node',
    label: 'Node yarn 构造器',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      yarnBuilder,
      nodeEntrypointBuilder
    ]
  },
  {
    type: 'node',
    label: 'Node npm 构造器（含 build 阶段）',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      npmBuilder,
      buildBuilder,
      nodeEntrypointBuilder
    ]
  },
  {
    type: 'node',
    label: 'Node npm 构造器',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      npmBuilder,
      nodeEntrypointBuilder
    ]
  },
  {
    type: 'node',
    label: 'Node 通用构造器',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      nodeEntrypointBuilder
    ]
  }
];
