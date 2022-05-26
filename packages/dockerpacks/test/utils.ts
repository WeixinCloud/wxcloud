import path, { join } from 'path';
import { expect, it } from 'vitest';
import { BuildError, DockerpacksBase, DockerpacksBuildResult } from '@runner/runner';
import { ServerApi } from '@api/server';
import { DEFAULT_BUILDER_GROUPS } from '@group/group';
import { TestMessageHandler } from './context';
import { promises } from 'fs';
import { HardCodedPromptIO } from '@builder/context';

const { writeFile, mkdir } = promises;
export class TestDockerpacks extends DockerpacksBase {
  constructor() {
    super(
      process.env.CI === 'true' ? ServerApi.TCB_SHANGHAI : new ServerApi('http://localhost:8080'),
      DEFAULT_BUILDER_GROUPS
    );
  }
}

export interface BuilderTestCase {
  id: string;
  expectPanic?: string | RegExp;
  promptAnswers?: Record<string, any>;
  e2e?: {
    skip?: boolean;
    buildOnly?: boolean;
  };
}

export function runTest(fixturesPath: string, testCase: BuilderTestCase) {
  it('should have correct outputs', async () => {
    const appRoot = path.join(fixturesPath, testCase.id);
    const dockerpacks = new TestDockerpacks();
    let buildResult: DockerpacksBuildResult = null!;

    try {
      const detectionResult = await dockerpacks.detect(
        appRoot,
        new HardCodedPromptIO(testCase.promptAnswers ?? {}),
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
      [...buildResult.files.entries()].map(([file, content]) =>
        safeWriteFile(join(appRoot, file), content)
      )
    ]);

    if (testCase.e2e?.skip) {
      await writeFile(join(appRoot, '.__skip__'), '');
    }

    if (testCase.e2e?.buildOnly) {
      await writeFile(join(appRoot, '.__build__only__'), '');
    }
  });
}

async function safeWriteFile(filePath: string, content: string) {
  const directory = path.dirname(filePath);
  await mkdir(directory, { recursive: true });
  await writeFile(filePath, content);
}
