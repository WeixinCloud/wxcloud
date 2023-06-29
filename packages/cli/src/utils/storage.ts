import { fetchApi } from '../api/base';

export interface IGenericStorage {
  bucket: string;
  region: string;
}

export async function getAuthorizationThunk(storage: IGenericStorage) {
  async function getAuthorization(options: {}, callback: (result: any) => void) {
    const timestamp = Date.now();
    const rawCredientials = await fetchApi('wxa-dev-qbase/gettcbtoken', {
      region: storage.region,
      source: storage.bucket,
      scene: 'TOKEN_SCENE_COS',
      service: 'cos'
    });
    if (!rawCredientials) {
      throw new Error(`getFederalToken failed: ${JSON.stringify(rawCredientials)}`);
    }
    const credentials = {
      TmpSecretId: rawCredientials.secretid,
      TmpSecretKey: rawCredientials.secretkey,
      XCosSecurityToken: rawCredientials.token,
      StartTime: ~~(timestamp / 1000), // 时间戳，单位秒，如：1580000000 1620272999264
      ExpiredTime: rawCredientials.expired_time // 时间戳，单位秒，如：1580000900
    };

    callback(credentials);

    return;
  }

  return getAuthorization;
}
