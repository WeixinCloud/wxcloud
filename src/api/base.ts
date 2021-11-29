import axios from "axios";
import { stat } from "fs";
import { cli } from "cli-ux";
import { createSign, readLoginState } from "../utils/auth";

export const BASE_URL = "https://wxardm.weixin.qq.com";

interface fetchApiOptions {
  skipSign?: boolean;
  params?: any;
  method?: any;
  wxCloudConfig?: {
    appid: string;
    privateKey: string;
  };
}

export async function getCloudRunCliRandStr(appid: string) {
  const config = {
    url: `${BASE_URL}/wxa-dev-qbase/getcloudrunclirandstr`,
    params: { appid },
  };
  //   console.log(config);
  const res = await axios.request(config);
  //   console.log(res.data);
  return res.data?.randstr;
}

export async function fetchApi(
  apiName: string,
  data: any,
  options: fetchApiOptions = {}
) {
  // todo: read local
  const appid = options.wxCloudConfig?.appid || (await readLoginState()).appid;
  const privateKey =
    options.wxCloudConfig?.privateKey || (await readLoginState()).privateKey;

  let sign, randStr;
  if (!options.skipSign) {
    randStr = await getCloudRunCliRandStr(appid);
    sign = createSign(JSON.stringify({ appid, rand_str: randStr }), privateKey);
  }

  const headers: any = {
    "X-CloudRunCli-Robot": "5",
  };
  if (sign) {
    headers["X-CloudRunCli-Signature"] = sign;
  }
  const config = {
    url: `${BASE_URL}/${apiName}`,
    data,
    method: options.method || "POST",
    params: {
      autodev: 1,
      appid,
      ...options.params,
    },
    headers,
  };
//   console.log(config);
  const res = await axios.request(config);
//   console.log(res.data);
  return res.data;
}
