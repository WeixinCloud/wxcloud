import path from 'path';
import { describe } from 'vitest';
import { BuilderTestCase, runTest } from '@test/utils';

const CASES: BuilderTestCase[] = [
  {
    id: 'no-version-constraint',
    promptAnswers: {
      environments: [],
      databaseExtensionSelection: '其它或不安装',
      databaseExtensionInput: 'pdo_mysql',
      staticDirectory: 'public'
    }
  },
  {
    id: 'laravel',
    promptAnswers: {
      environments: [],
      databaseExtensionSelection: '其它或不安装',
      databaseExtensionInput: 'pdo_mysql',
      staticDirectory: 'public'
    }
  },
  {
    id: 'thinkphp',
    promptAnswers: {
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
