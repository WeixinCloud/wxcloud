import { test } from '@oclif/test';
import { TEST_APP_ID, TEST_APP_KEY, TEST_ENV_ID, TEST_SERVICE_ID } from './constants';
import { expect } from 'chai';

describe('login', () => {
  test
    .stdout()
    .command(['login', '-a', 'bad_id', '-k', 'bad_key'])
    .exit(201)
    .it('should fail to login with a bad key');

  test
    .stdout()
    .command(['login', '-a', TEST_APP_ID, '-k', TEST_APP_KEY])
    .it('should login successfully with a correct key');
});

describe('env', () => {
  describe('list', () => {
    test
      .stdout()
      .command(['env:list', '--json'])
      .it('should return correct environments list', ctx => {
        // @ts-ignore
        expect(ctx.stdout).toMatchSnapshot();
      });
  });
});

describe('service', () => {
  describe('list', () => {
    test
      .stdout()
      .command(['service:list', '-e', TEST_ENV_ID, '--json'])
      .it('should return correct services list', ctx => {
        // @ts-ignore
        expect(ctx.stdout).toMatchSnapshot();
      });
  });

  describe('create', () => {
    test
      .stdout()
      .command(['service:create', '-e', TEST_ENV_ID, '-s', TEST_SERVICE_ID, '--json'])
      .it('should create service successfully');
  });

  describe('config', () => {
    test
      .stdout()
      .command([
        'service:config',
        '-e',
        TEST_ENV_ID,
        '-s',
        TEST_SERVICE_ID,
        '-p',
        'foo=bar',
        '--noConfirm'
      ])
      .it('should update service config successfully');
  });
});

describe('logout', () => {
  test.stdout().command(['logout']).it('should logout successfully');
});
