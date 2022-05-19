import { commonEnvBuilder } from '@builder/common/env';
import { commonExposeBuilder } from '@builder/common/expose';
import { golangBuildBuilder } from '@builder/golang/build';
import { golangModuleBuilder } from '@builder/golang/mod';
import { golangRuntimeBuilder } from '@builder/golang/runtime';
import { BuilderGroup } from './group';

export const GOLANG_GROUPS: BuilderGroup[] = [
  {
    type: 'golang',
    label: 'Golang 默认构造器',
    builders: [
      golangRuntimeBuilder,
      commonEnvBuilder,
      golangModuleBuilder,
      golangBuildBuilder,
      commonExposeBuilder
    ]
  }
];
