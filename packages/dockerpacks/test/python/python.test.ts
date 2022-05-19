import path from 'path';
import { describe } from 'vitest';
import { BuilderTestCase, runTest } from '@test/utils';

const CASES: BuilderTestCase[] = [
  {
    id: 'flask',
    promptAnswers: {
      environments: []
    }
  },
  {
    id: 'django',
    promptAnswers: {
      environments: []
    }
  }
];

const FIXTURES_PATH = path.join(__dirname, 'fixtures');

describe('builders test (python cases)', () => {
  describe.each(CASES)('case $id', testCase => {
    runTest(FIXTURES_PATH, testCase);
  });
});
