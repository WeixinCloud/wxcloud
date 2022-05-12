import { ServerApi } from '@api/server';
import { DEFAULT_BUILDER_GROUPS } from '@runner/group';
import { DockerpacksRunnerBase } from '@runner/runner';

export class TestRunner extends DockerpacksRunnerBase {
  constructor() {
    super(new ServerApi('http://localhost:8080'), DEFAULT_BUILDER_GROUPS);
  }
}
