import { commonEnvBuilder } from '@builder/common/env';
import { javaEntrypointBuilder } from '@builder/java/entrypoint';
import { javaGradleBuilder } from '@builder/java/gradle';
import { javaMavenBuilder } from '@builder/java/maven';
import { BuilderGroup } from './group';

export const JAVA_GROUPS: BuilderGroup[] = [
  {
    type: 'java',
    label: 'Java Maven 构造器',
    builders: [javaMavenBuilder, commonEnvBuilder, javaEntrypointBuilder]
  },
  {
    type: 'java',
    label: 'Java Gradle 构造器',
    builders: [javaGradleBuilder, commonEnvBuilder, javaEntrypointBuilder]
  }
];
