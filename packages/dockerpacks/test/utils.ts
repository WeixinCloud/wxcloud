import path from 'path';
import { expect, it } from 'vitest';
import { TestMessageHandler, TestPromptIO } from './context';
import { TestRunner } from './runner';

export interface BuilderTestCase {
  id: string;
  promptAnswers?: Record<string, any>;
}

export function runTest(fixturesPath: string, testCase: BuilderTestCase) {
  it('should have correct outputs', async () => {
    const runner = new TestRunner();
    const result = await runner.run(
      path.join(fixturesPath, testCase.id),
      new TestPromptIO(testCase.promptAnswers ?? {}),
      new TestMessageHandler()
    );
    expect(result).toMatchSnapshot();
  });
}
