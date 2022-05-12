import { commonEnvBuilder } from '@builder/common/env';
import { golangBuildBuilder } from '@builder/golang/build';
import { golangModuleBuilder } from '@builder/golang/mod';
import { golangRuntimeBuilder } from '@builder/golang/runtime';
import { BuilderGroup } from '../group';

export const GOLANG_GROUPS: BuilderGroup[] = [
  {
    label: 'Dockerpacks Golang builder group',
    builders: [golangRuntimeBuilder, commonEnvBuilder, golangModuleBuilder, golangBuildBuilder]
  }
];
