import { pipBuilder } from '@builder/python/pip';
import { pythonRuntimeBuilder } from '@builder/python/runtime';
import { commonEnvBuilder } from '@builder/common/env';
import { pythonEntrypointBuilder } from '@builder/python/entrypoint';
import { BuilderGroup } from './group';
import { commonExposeBuilder } from '@builder/common/expose';

export const PYTHON_GROUPS: BuilderGroup[] = [
  {
    type: 'python',
    label: 'Python 通用构造器',
    builders: [
      pythonRuntimeBuilder,
      commonEnvBuilder,
      pipBuilder,
      pythonEntrypointBuilder,
      commonExposeBuilder
    ]
  }
];
