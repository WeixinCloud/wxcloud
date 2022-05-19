import { describe } from 'vitest';
import { BuilderTestCase, runTest } from '@test/utils';
import path from 'path';

const CASES: BuilderTestCase[] = [
  {
    id: 'starters-gin',
    promptAnswers: {
      expose: '3000',
      environments: []
    }
  },
  {
    id: 'wxcloudrun-golang',
    promptAnswers: {
      expose: '3000',
      environments: []
    }
  }
];

const FIXTURES_PATH = path.join(__dirname, 'fixtures');

describe('builders test (golang cases)', () => {
  describe.each(CASES)('case $id', testCase => {
    runTest(FIXTURES_PATH, testCase);
  });
});
