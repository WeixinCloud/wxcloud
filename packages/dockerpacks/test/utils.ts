import path, { join } from 'path';
import { BuildError, DockerpacksBase, DockerpacksBuildResult } from '@runner/runner';
import { DEFAULT_BUILDER_GROUPS } from '@group/group';
import { expect, it } from 'vitest';
import { HardCodedPromptIO } from '@builder/context';
import { promises } from 'fs';
import { PromptRegistration } from '@builder/types';
import { ServerApi } from '@api/server';
import { TestMessageHandler } from './context';

const { writeFile, mkdir } = promises;

export class TestDockerpacks extends DockerpacksBase {
  constructor() {
    super(ServerApi.TCB_SHANGHAI, DEFAULT_BUILDER_GROUPS);
  }
}

export interface BuilderTestCase {
  id: string;
  expectPanic?: string | RegExp;
  promptAnswers?: PromptRegistration;
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
        new HardCodedPromptIO(testCase.promptAnswers ?? {}) as any,
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
