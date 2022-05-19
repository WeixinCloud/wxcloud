import { flaskBuilder } from '@builder/python/flask';
import { pipBuilder } from '@builder/python/pip';
import { djangoBuilder } from '@builder/python/django';
import { pythonRuntimeBuilder } from '@builder/python/runtime';
import { commonEnvBuilder } from '@builder/common/env';
import { pythonEntrypointBuilder } from '@builder/python/entrypoint';
import { BuilderGroup } from './group';
import { commonExposeBuilder } from '@builder/common/expose';

export const PYTHON_GROUPS: BuilderGroup[] = [
  {
    type: 'python',
    label: 'Python Flask 构造器',
    builders: [
      pythonRuntimeBuilder,
      commonEnvBuilder,
      pipBuilder,
      flaskBuilder,
      commonExposeBuilder
    ]
  },
  {
    type: 'python',
    label: 'Python Django 构造器',
    builders: [
      pythonRuntimeBuilder,
      commonEnvBuilder,
      pipBuilder,
      djangoBuilder,
      commonExposeBuilder
    ]
  },
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
