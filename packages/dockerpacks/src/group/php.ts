import { commonEnvBuilder } from '@builder/common/env';
import { commonExposeBuilder } from '@builder/common/expose';
import { phpComposerBuilder } from '@builder/php/composer';
import { phpEntrypointBuilder } from '@builder/php/entrypoint';
import { phpExtensionsBuilder } from '@builder/php/extensions';
import { phpFpmBuilder } from '@builder/php/fpm';
import { laravelBuilder } from '@builder/php/laravel';
import { nginxBuilder } from '@builder/php/nginx';
import { thinkPhpBuilder } from '@builder/php/thinkphp';
import { BuilderGroup } from './group';

export const PHP_GROUPS: BuilderGroup[] = [
  {
    type: 'php',
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
  }
];
