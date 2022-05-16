import { commonEnvBuilder } from '@builder/common/env';
import { buildBuilder } from '@builder/node/build';
import { nodeEntrypointBuilder } from '@builder/node/entrypoint';
import { npmBuilder } from '@builder/node/npm';
import { pnpmBuilder } from '@builder/node/pnpm';
import { nodeRuntimeBuilder } from '@builder/node/runtime';
import { svelteKitStaticBuilder } from '@builder/node/sveltekit-static';
import { yarnBuilder } from '@builder/node/yarn';
import { BuilderGroup } from '../group';

export const NODE_GROUPS: BuilderGroup[] = [
  {
    label: 'Dockerpacks Node builder group for pnpm with build stage',
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
    label: 'Dockerpacks Node builder group for pnpm',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      pnpmBuilder,
      nodeEntrypointBuilder
    ]
  },
  {
    label: 'Dockerpacks Node builder group for Yarn with build stage',
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
    label: 'Dockerpacks Node builder group for Yarn',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      yarnBuilder,
      nodeEntrypointBuilder
    ]
  },
  {
    label: 'Dockerpacks Node builder group for NPM with build stage',
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
    label: 'Dockerpacks Node builder group for NPM',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      npmBuilder,
      nodeEntrypointBuilder
    ]
  },
  {
    label: 'Dockerpacks Node builder group for general Node projects',
    builders: [
      nodeRuntimeBuilder,
      [svelteKitStaticBuilder, true],
      commonEnvBuilder,
      nodeEntrypointBuilder
    ]
  }
];
