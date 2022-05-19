import { describe } from 'vitest';
import { BuilderTestCase, runTest } from '@test/utils';
import path from 'path';

const CASES: BuilderTestCase[] = [
  {
    id: 'build',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'none',
    promptAnswers: { expose: '3000', generalEntrypoint: 'node test/index.js', environments: [] }
  },
  {
    id: 'package-lock',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'npm',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'yarn1',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'yarn2',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'pnpm',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'create-react-app',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'starters-nuxt',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'starters-expressjs',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'starters-sveltekit',
    promptAnswers: { expose: '3000', generalEntrypoint: 'node build/index.js', environments: [] }
  },
  {
    id: 'starters-nextjs-prisma',
    promptAnswers: { expose: '3000', environments: ['DATABASE_URL=mongo://test'] }
  },
  {
    id: 'sveltekit-cli-node-adapter',
    promptAnswers: { expose: '3000', environments: [], generalEntrypoint: 'node build/index.js' }
  },
  {
    id: 'sveltekit-cli-static-adapter',
    expectPanic: /adapter-static/i,
    promptAnswers: { expose: '3000', environments: [], generalEntrypoint: 'node build/index.js' }
  },
  {
    id: 'nextjs-cli',
    promptAnswers: { expose: '3000', environments: [] }
  },
  {
    id: 'nextjs-cli-pnpm',
    promptAnswers: { expose: '3000', environments: [] }
  }
];

const FIXTURES_PATH = path.join(__dirname, 'fixtures');

describe('builders test (node cases)', () => {
  describe.each(CASES)('case $id', testCase => {
    runTest(FIXTURES_PATH, testCase);
  });
});
