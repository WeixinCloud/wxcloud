import { readLoginState } from "../utils/auth";
import { fetchApi } from "./base";

// export async function getServiceList() {
// const res = await fetchApi("tcb/service", );
// }

type DescribeWxCloudBaseRunEnvsResp = {
  Alias: string;
  CreateTime: string;
  Databases: any[];
  EnvChannel: string;
  EnvId: string;
  Functions: any[];
  IsAutoDegrade: boolean;
  IsDefault: boolean;
  LogServices: any[];
  PackageId: string;
  PackageName: string;
  PayMode: string;
  Region: string;
  Source: string;
  StaticStorages: any[];
  Status: string;
  Storages: any[];
  UpdateTime: string;
}[]
export async function DescribeWxCloudBaseRunEnvs(): Promise<DescribeWxCloudBaseRunEnvsResp> {
  const { appid } = await readLoginState();
  const res = await fetchApi("wxa-dev-qbase/apihttpagent", {
    postdata: JSON.stringify({ WxAppId: appid }),
    cgi_id: 260,
    service: "tcb",
    action: "DescribeWxCloudBaseRunEnvs",
    version: "2018-06-08",
    region: "",
  });
  try {
    const response = JSON.parse(res.content);
    return response?.Response?.EnvList;
  } catch (e) {
    throw e;
  }
}
