import { checkLoginState, writeLoginState } from './utils/auth';
import { fetchApi } from './api/base';
import * as cloudapi from './api/cloudapiDirect'
export class WXCloud {
  async init(appid: string, privateKey: string) {
    // ensure appid and pk is entered when using node sdk
    if (!appid || !privateKey) {
      throw new Error('appid and privateKey are required');
    }
    const logined = await checkLoginState(appid, privateKey);
    if (!logined) {
      throw new Error('login failed. please check your credientials.')
    } else {
      writeLoginState(appid, privateKey);
    }
  }
  fetchApi = fetchApi;
  cloudapi = cloudapi;
}
