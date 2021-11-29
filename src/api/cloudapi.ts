import { readLoginState } from "../utils/auth";
import { fetchApi } from "./base";
import { CloudBaseRunServer, EnvInfo, VersionInfo } from "./interface";

export async function DescribeCloudBaseBuildService(data: {
  EnvId: string;
  ServiceName: string;
}): Promise<{
  DownloadHeaders: any[];
  DownloadUrl: string;
  OutDate: boolean;
  PackageName: string;
  PackageVersion: string;
  RequestId: string;
  UploadHeaders: any[];
  UploadUrl: string;
}> {
  return callCloudApi("DescribeCloudBaseBuildService", data);
}

export async function DescribeWxCloudBaseRunEnvs(): Promise<{
  EnvList: EnvInfo[];
}> {
  const { appid } = await readLoginState();
  return callCloudApi("DescribeWxCloudBaseRunEnvs", { WxAppId: appid });
}

export async function DescribeCloudBaseRunServerVersion(params: {
  EnvId: string;
  ServiceName: string;
  VersionName: string;
}): Promise<VersionInfo> {
  return callCloudApi("DescribeCloudBaseRunServerVersion", params);
}

export async function DescribeCloudBaseRunServer(params: {
  EnvId: string;
  ServerName: string;
  Offset: number;
  Limit: number;
}): Promise<CloudBaseRunServer> {
  return callCloudApi("DescribeCloudBaseRunServer", params);
}

export async function DescribeCloudBaseRunServers(params: {
  EnvId: string;
  Offset: number;
  Limit: number;
}): Promise<{
  CloudBaseRunServerSet: CloudBaseRunServer[];
}> {
  return callCloudApi("DescribeCloudBaseRunServers", params);
}

export async function callCloudApi(action: string, data: Object) {
  const res = await fetchApi("wxa-dev-qbase/apihttpagent", {
    action,
    postdata: JSON.stringify(data),
    region: "",
    service: "tcb",
    version: "2018-06-08",
  });
  if (res?.base_resp?.ret === 0) {
    const response = JSON.parse(res.content);
    if (response.Response?.Error) {
      console.log(action);
      console.log(data)
      console.log(response)
      const error = response.Response.Error;
      throw new Error(
        `${error.Message} (RequestId: ${response.Response.RequestId})`
      );
    }
    return response?.Response;
  } else {
    throw new Error(res?.base_resp?.errmsg);
  }
}
