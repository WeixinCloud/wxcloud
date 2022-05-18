import { flaskBuilder } from '@builder/python/flask';
import { pipBuilder } from '@builder/python/pip';
import { djangoBuilder } from '@builder/python/django';
import { pythonRuntimeBuilder } from '@builder/python/runtime';
import { commonEnvBuilder } from '@builder/common/env';
import { pythonEntrypointBuilder } from '@builder/python/entrypoint';
import { BuilderGroup } from './group';

export const PYTHON_GROUPS: BuilderGroup[] = [
  {
    type: 'python',
    label: 'Dockerpacks Python builder group for flask apps',
    builders: [pythonRuntimeBuilder, commonEnvBuilder, pipBuilder, flaskBuilder]
  },
  {
    type: 'python',
    label: 'Dockerpacks Python builder group for django apps',
    builders: [pythonRuntimeBuilder, commonEnvBuilder, pipBuilder, djangoBuilder]
  },
  {
    type: 'python',
    label: 'Dockerpacks Python builder group for common apps',
    builders: [pythonRuntimeBuilder, commonEnvBuilder, pipBuilder, pythonEntrypointBuilder]
  }
];
