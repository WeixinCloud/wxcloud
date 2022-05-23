import { describe } from 'vitest';
import { BuilderTestCase, runTest } from '@test/utils';
import path from 'path';

const CASES: BuilderTestCase[] = [
  {
    id: 'build',
    e2e: { skip: true },
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'none',
    e2e: { skip: true },
    promptAnswers: { expose: '3000', generalEntrypoint: 'node test/index.js', environments: [] }
  },
  {
    id: 'package-lock',
    e2e: { skip: true },
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'npm',
    e2e: { skip: true },
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'yarn1',
    e2e: { skip: true },
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'yarn2',
    e2e: { skip: true },
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'pnpm',
    e2e: { skip: true },
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'create-react-app',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'create-nuxt-app',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'create-next-app-yarn',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'create-next-app-pnpm',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'sveltekit-cli-node-adapter',
    promptAnswers: {
      expose: '3000',
      environments: [],
      generalEntrypoint: 'npm run preview -- --host'
    }
  },
  {
    id: 'sveltekit-cli-static-adapter',
    e2e: { skip: true },
    expectPanic: /adapter-static/i,
    promptAnswers: {
      expose: '3000',
      environments: [],
      generalEntrypoint: 'npm run preview -- --host'
    }
  },
  {
    id: 'expressjs',
    promptAnswers: { expose: '3000', environments: [] }
  }
];

const FIXTURES_PATH = path.join(__dirname, 'fixtures');

describe('builders test (node cases)', () => {
  describe.each(CASES)('case $id', testCase => {
    runTest(FIXTURES_PATH, testCase);
  });
});
