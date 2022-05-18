import { commonEnvBuilder } from '@builder/common/env';
import { javaEntrypointBuilder } from '@builder/java/entrypoint';
import { javaGradleBuilder } from '@builder/java/gradle';
import { javaMavenBuilder } from '@builder/java/maven';
import { BuilderGroup } from './group';

export const JAVA_GROUPS: BuilderGroup[] = [
  {
    type: 'java',
    label: 'Dockerpacks Java builder group for maven projects',
    builders: [javaMavenBuilder, commonEnvBuilder, javaEntrypointBuilder]
  },
  {
    type: 'java',
    label: 'Dockerpacks Java builder group for gradle projects',
    builders: [javaGradleBuilder, commonEnvBuilder, javaEntrypointBuilder]
  }
];