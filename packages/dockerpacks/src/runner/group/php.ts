import { commonEnvBuilder } from '@builder/common/env';
import { phpComposerBuilder } from '@builder/php/composer';
import { phpEntrypointBuilder } from '@builder/php/entrypoint';
import { phpExtensionsBuilder } from '@builder/php/extensions';
import { phpFpmBuilder } from '@builder/php/fpm';
import { laravelBuilder } from '@builder/php/laravel';
import { nginxBuilder } from '@builder/php/nginx';
import { thinkPhpBuilder } from '@builder/php/thinkphp';
import { BuilderGroup } from '../group';

export const PHP_GROUPS: BuilderGroup[] = [
  {
    label: 'Dockerpacks Python builder group for php thinkphp framework',
    builders: [
      phpFpmBuilder,
      commonEnvBuilder,
      phpExtensionsBuilder,
      nginxBuilder,
      [phpComposerBuilder, true],
      thinkPhpBuilder,
      phpEntrypointBuilder
    ]
  },
  {
    label: 'Dockerpacks Python builder group for php laravel framework',
    builders: [
      phpFpmBuilder,
      commonEnvBuilder,
      phpExtensionsBuilder,
      nginxBuilder,
      [phpComposerBuilder, true],
      laravelBuilder,
      phpEntrypointBuilder
    ]
  },
  {
    label: 'Dockerpacks Python builder group for general php frameworks',
    builders: [
      phpFpmBuilder,
      commonEnvBuilder,
      phpExtensionsBuilder,
      nginxBuilder,
      [phpComposerBuilder, true],
      phpEntrypointBuilder
    ]
  }
];
