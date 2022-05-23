import { describe } from 'vitest';
import { BuilderTestCase, runTest } from '@test/utils';
import path from 'path';

const CASES: BuilderTestCase[] = [
  {
    id: 'with-jar',
    e2e: { skip: true },
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'wxcloudrun-sprintboot',
    promptAnswers: {
      expose: '80',
      environments: [],
      entrypointJar: 'target/springboot-wxcloudrun-1.0.jar'
    }
  },
  {
    id: 'starters-kotlin-spring',
    promptAnswers: {
      expose: '8080',
      environments: [],
      entrypointJar: 'build/libs/demo-0.0.1-SNAPSHOT.jar'
    }
  }
];

const FIXTURES_PATH = path.join(__dirname, 'fixtures');

describe('builders test (java cases)', () => {
  describe.each(CASES)('case $id', testCase => {
    runTest(FIXTURES_PATH, testCase);
  });
});
