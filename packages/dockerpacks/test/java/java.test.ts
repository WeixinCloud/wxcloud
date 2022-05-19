import { describe } from 'vitest';
import { BuilderTestCase, runTest } from '@test/utils';
import path from 'path';

const CASES: BuilderTestCase[] = [
  {
    id: 'with-jar',
    promptAnswers: {
      environments: []
    }
  },
  {
    id: 'wxcloudrun-sprintboot',
    promptAnswers: {
      environments: [],
      entrypointJar: 'dist/app.jar'
    }
  },
  {
    id: 'starters-kotlin-spring',
    promptAnswers: {
      environments: [],
      entrypointJar: 'dist/app.jar'
    }
  }
];

const FIXTURES_PATH = path.join(__dirname, 'fixtures');

describe('builders test (java cases)', () => {
  describe.each(CASES)('case $id', testCase => {
    runTest(FIXTURES_PATH, testCase);
  });
});
