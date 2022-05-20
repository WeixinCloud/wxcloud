import path from 'path';
import { describe } from 'vitest';
import { BuilderTestCase, runTest } from '@test/utils';

const CASES: BuilderTestCase[] = [
  {
    id: 'no-version-constraint',
    e2e: { skip: true },
    promptAnswers: {
      expose: '3000',
      environments: [],
      databaseExtensionSelection: '其它或不安装',
      databaseExtensionInput: 'pdo_mysql',
      staticDirectory: 'public'
    }
  },
  {
    id: 'laravel',
    e2e: { skip: true },
    promptAnswers: {
      expose: '3000',
      environments: [],
      databaseExtensionSelection: '其它或不安装',
      databaseExtensionInput: 'pdo_mysql',
      staticDirectory: 'public'
    }
  },
  {
    id: 'thinkphp',
    e2e: { skip: true },
    promptAnswers: {
      expose: '3000',
      environments: [],
      databaseExtensionSelection: '其它或不安装',
      databaseExtensionInput: 'pdo_mysql',
      staticDirectory: 'public'
    }
  }
];

const FIXTURES_PATH = path.join(__dirname, 'fixtures');

describe('builders test (php cases)', () => {
  describe.each(CASES)('case $id', testCase => {
    runTest(FIXTURES_PATH, testCase);
  });
});
