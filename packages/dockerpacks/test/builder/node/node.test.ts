import { describe } from 'vitest';
import { BuilderTestCase, runTest } from '@test/utils';
import path from 'path';

const CASES: BuilderTestCase[] = [
  {
    id: 'build',
    promptAnswers: {
      environments: []
    }
  },
  {
    id: 'none',
    promptAnswers: {
      generalEntrypoint: 'node test/index.js',
      environments: []
    }
  },
  {
    id: 'npm',
    promptAnswers: {
      environments: []
    }
  },
  {
    id: 'yarn1',
    promptAnswers: {
      environments: []
    }
  },
  {
    id: 'yarn2',
    promptAnswers: {
      environments: []
    }
  },
  {
    id: 'pnpm',
    promptAnswers: {
      environments: []
    }
  },
  {
    id: 'starters-nuxt',
    promptAnswers: {
      environments: []
    }
  },
  {
    id: 'starters-expressjs',
    promptAnswers: {
      environments: []
    }
  },
  {
    id: 'starters-sveltekit',
    promptAnswers: {
      generalEntrypoint: 'node build/index.js',
      environments: []
    }
  },
  {
    id: 'starters-nextjs-prisma',
    promptAnswers: {
      environments: ['DATABASE_URL=mongo://test']
    }
  },
  {
    id: 'nextjs-cli',
    promptAnswers: {
      environments: []
    }
  },
  {
    id: 'nextjs-cli-pnpm',
    promptAnswers: {
      environments: []
    }
  }
];

const FIXTURES_PATH = path.join(__dirname, 'fixtures');

describe('builders test (node cases)', () => {
  describe.each(CASES)('case %#', testCase => {
    runTest(FIXTURES_PATH, testCase);
  });
});
