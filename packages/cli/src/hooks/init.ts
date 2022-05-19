import { Hook } from '@oclif/core';
import { initCloudAPI } from '../api/adapter';
import { readLoginState } from '../utils/auth';
import { logger } from '../utils/log';

const hook: Hook<'init'> = async function (options) {
  try {
    const appid = (await readLoginState()).appid;
    initCloudAPI(appid);
  } catch (error) {
    logger.debug('init cloudapi: ', error);
  }
};

export default hook;
