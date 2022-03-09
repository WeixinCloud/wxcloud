import { checkLoginState, writeLoginState } from './utils/auth';
import { fetchApi } from './api/base';
import * as cloudapi from './api/cloudapi'
export class WXCloud {
  async init(appid: string, privateKey: string) {
    const logined = await checkLoginState(appid, privateKey);
    if (!logined) {
      throw new Error('login failed. please check credientials.')
    } else {
      writeLoginState(appid, privateKey);
    }
  }
  fetchApi = fetchApi;
  cloudapi = cloudapi;
}
