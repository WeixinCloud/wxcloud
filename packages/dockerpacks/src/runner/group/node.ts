import { commonEnvBuilder } from '@builder/common/env';
import { buildBuilder } from '@builder/node/build';
import { nodeEntrypointBuilder } from '@builder/node/entrypoint';
import { npmBuilder } from '@builder/node/npm';
import { nodeRuntimeBuilder } from '@builder/node/runtime';
import { yarnBuilder } from '@builder/node/yarn';
import { BuilderGroup } from '../group';

export const NODE_GROUPS: BuilderGroup[] = [
  {
    label: 'Dockerpacks Node builder group for Yarn with build stage',
    builders: [
      nodeRuntimeBuilder,
      commonEnvBuilder,
      yarnBuilder,
      buildBuilder,
      nodeEntrypointBuilder
    ]
  },
  {
    label: 'Dockerpacks Node builder group for Yarn',
    builders: [nodeRuntimeBuilder, commonEnvBuilder, yarnBuilder, nodeEntrypointBuilder]
  },
  {
    label: 'Dockerpacks Node builder group for NPM with build stage',
    builders: [
      nodeRuntimeBuilder,
      commonEnvBuilder,
      npmBuilder,
      buildBuilder,
      nodeEntrypointBuilder
    ]
  },
  {
    label: 'Dockerpacks Node builder group for NPM',
    builders: [nodeRuntimeBuilder, commonEnvBuilder, npmBuilder, nodeEntrypointBuilder]
  },
  {
    label: 'Dockerpacks Node builder group for general Node projects',
    builders: [nodeRuntimeBuilder, commonEnvBuilder, nodeEntrypointBuilder]
  }
];