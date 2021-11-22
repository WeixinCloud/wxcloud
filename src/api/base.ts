import axios from "axios";
import { createSign } from "../utils/auth";

export const BASE_URL = "https://wxardm.weixin.qq.com/wxa-dev-qbase";

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
  const data = await fetchApi(
    "getcloudrunclirandstr",
    {},
    {
      method: "GET",
      params: { appid },
      skipSign: true,
    }
  );
  return data?.randstr;
}

export async function fetchApi(
  apiName: string,
  data: any,
  options: fetchApiOptions = {}
) {
  // todo: read local
  const appid = options.wxCloudConfig?.appid || "";
  const privateKey = options.wxCloudConfig?.privateKey || "";

  let sign, randStr;
  if (!options.skipSign) {
    randStr = await getCloudRunCliRandStr(appid);
    data = { ...data, rand_str: randStr };
    sign = createSign(JSON.stringify(data), privateKey);
  }

  const headers: any = {
    "X-CloudRunCli-Robot": "5",
  };
  if (sign) {
      headers["X-CloudRunCli-Signature"] = sign
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
