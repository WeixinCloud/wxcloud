import path from 'path';
import { expect, it } from 'vitest';
import { BuildError, DockerpacksBase } from '@runner/runner';
import { ServerApi } from '@api/server';
import { DEFAULT_BUILDER_GROUPS } from '@group/group';
import { TestMessageHandler, TestPromptIO } from './context';

export class TestDockerpacks extends DockerpacksBase {
  constructor() {
    super(new ServerApi('http://localhost:8080'), DEFAULT_BUILDER_GROUPS);
  }
}

export interface BuilderTestCase {
  id: string;
  expectPanic?: string | RegExp;
  promptAnswers?: Record<string, any>;
}

export function runTest(fixturesPath: string, testCase: BuilderTestCase) {
  it('should have correct outputs', async () => {
    const dockerpacks = new TestDockerpacks();
    try {
      const detectionResult = await dockerpacks.detectBuilders(
        path.join(fixturesPath, testCase.id),
        new TestPromptIO(testCase.promptAnswers ?? {}),
        new TestMessageHandler()
      );
      expect(detectionResult).not.toBeNull();
      const buildResult = await detectionResult!.build();
      expect(buildResult).toMatchSnapshot();
    } catch (e) {
      if (testCase.expectPanic !== undefined) {
        expect(e).toBeInstanceOf(BuildError);
        expect((e as BuildError).error.reason?.message).toMatch(testCase.expectPanic);
      } else {
        throw e;
      }
    }
  });
}
