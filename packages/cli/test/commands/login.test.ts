import { expect, test } from '@oclif/test';

describe('login command', () => {
  test
    .command([
      'login',
      '-a',
      'wx069a87eae381af2b',
      '-k',
      'AAQ9G7sEAAABAAAAAAA0wOtj8MKuor6wMcSdYiAAAAAraAdzKm8i8JwFJ68cDOJBtIHsmv3F8e00LCv7f+tYvtRKJNWjemEG9Y1/xbF6qhJ5puOwHq/xJi19Q19HXUtyp/RoO4Gjp0D4ZOC7lWYnVzO7pfJnQkvu0Sx/DRksakIkq0tW/O5PZJNgHxs7yh9dEa0txgO0djr1Tg=='
    ])
    .it('should login successfully with a correct key');

  test
    .command(['login', '-a', 'bad_id', '-k', 'bad_key'])
    .exit(201)
    .it('should fail to login with a bad key');
});
