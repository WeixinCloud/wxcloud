import path, { join } from 'path';
import { expect, it } from 'vitest';
import { BuildError, DockerpacksBase, DockerpacksBuildResult } from '@runner/runner';
import { ServerApi } from '@api/server';
import { DEFAULT_BUILDER_GROUPS } from '@group/group';
import { TestMessageHandler, TestPromptIO } from './context';
import { writeFile } from 'fs/promises';

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
    const appRoot = path.join(fixturesPath, testCase.id);
    const dockerpacks = new TestDockerpacks();
    let buildResult: DockerpacksBuildResult = null!;

    try {
      const detectionResult = await dockerpacks.detectBuilders(
        appRoot,
        new TestPromptIO(testCase.promptAnswers ?? {}),
        new TestMessageHandler()
      );
      expect(detectionResult).not.toBeNull();

      buildResult = await detectionResult!.build();
      expect(buildResult).toMatchSnapshot();
    } catch (e) {
      if (testCase.expectPanic !== undefined) {
        expect(e).toBeInstanceOf(BuildError);
        expect((e as BuildError).error.reason?.message).toMatch(testCase.expectPanic);
        return;
      } else {
        throw e;
      }
    }

    await Promise.all([
      await writeFile(join(appRoot, 'Dockerfile'), buildResult.dockerfile),
      [...buildResult.files.entries()].map(
        async ([file, content]) => await writeFile(join(appRoot, file), content)
      )
    ]);
  });
}
