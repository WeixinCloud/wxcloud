import path from 'path';
import { describe } from 'vitest';
import { BuilderTestCase, runTest } from '@test/utils';

const CASES: BuilderTestCase[] = [
  {
    id: 'flask',
    e2e: {
      buildOnly: true
    },
    promptAnswers: {
      expose: '80',
      environments: ['MYSQL_USERNAME=root', 'MYSQL_PASSWORD=', 'MYSQL_ADDRESS=172.18.123.123:3306'],
      entrypoint: 'python3 run.py 0.0.0.0 80'
    }
  },
  {
    id: 'django',
    e2e: {
      buildOnly: true
    },
    promptAnswers: {
      expose: '80',
      environments: ['MYSQL_USERNAME=root', 'MYSQL_PASSWORD=', 'MYSQL_ADDRESS=172.18.123.123:3306'],
      entrypoint: 'python3 manage.py runserver 0.0.0.0:80'
    }
  }
];

const FIXTURES_PATH = path.join(__dirname, 'fixtures');

describe('builders test (python cases)', () => {
  describe.each(CASES)('case $id', testCase => {
    runTest(FIXTURES_PATH, testCase);
  });
});
