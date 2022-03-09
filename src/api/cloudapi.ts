import { readLoginState } from "../utils/auth";
import { fetchApi } from "./base";
import { CloudBaseRunServer, EnvInfo, VersionInfo } from "./interface";
import cli from "cli-ux";

// 新的接口不太好使，CI 还是先用老的

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

export async function DescribeCloudBaseRunServiceDomain(params: {
  EnvId: string;
  ServiceName: string;
}): Promise<{
  DefaultPublicDomain: string // 默认公网服务域名
  DefaultInternalDomain: string // 默认内网服务域名
  AccessTypes: string[] // 访问类型
  RequestId: string // 唯一请求 ID，每次请求都会返回。定位问题时需要提供该次请求的 RequestId。
}> {
  const { appid } = await readLoginState();
  return callCloudApi("DescribeCloudBaseRunServiceDomain", params);
}

export async function DescribeWxCloudBaseRunEnvs(): Promise<{
  EnvList: EnvInfo[];
}> {
  const { appid } = await readLoginState();
  return callCloudApi("DescribeWxCloudBaseRunEnvs", { WxAppId: appid });
}

export async function DescribeCloudBaseRunServerVersion(params: {
  EnvId: string;
  ServerName: string;
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

export async function SubmitServerRelease(params: {
  BuildDir: string;
  DeployType: string;
  Dockerfile: string;
  EnvId: string;
  HasDockerfile: boolean;
  PackageName: string;
  PackageVersion: string;
  Port: number;
  ReleaseType: string;
  ServerName: string;
  WxAppId: string;
}): Promise<{
  Result: string;
  RunId: string;
  VersionName: string;
}> {
  return callCloudApi("SubmitServerRelease", params);
}

export async function CreateCloudBaseRunServerVersion(params: {
  BuildDir: string;
  ContainerPort: number;
  Cpu: number;
  CustomLogs: string;
  DockerfilePath: string;
  EntryPoint: string;
  EnvId: string;
  EnvParams: string;
  FlowRatio: number;
  HasDockerfile: number;
  MaxNum: number;
  Mem: number;
  MinNum: number;
  MountWxToken: boolean;
  PackageName: string;
  PackageVersion: string;
  PolicyThreshold: number;
  PolicyType: string;
  ServerName: string;
  UploadType: string;
  VersionRemark: string;
}): Promise<{
  Result: string;
  RunId: string;
  VersionName: string;
}> {
  return callCloudApi("CreateCloudBaseRunServerVersion", params);
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
      console.log(data);
      console.log(response);
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
