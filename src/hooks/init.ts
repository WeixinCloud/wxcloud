
import { Hook } from '@oclif/core'
import { initCloudAPI } from '../api/adapter'
import { tcbDescribeEnvLimit } from '../api/cloudapi';
import { readLoginState } from '../utils/auth';

const hook: Hook<'init'> = async function (options) {
  const appid = (await readLoginState()).appid;
  initCloudAPI(appid)
}

export default hook