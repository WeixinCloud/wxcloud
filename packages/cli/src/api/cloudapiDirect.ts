import { readLoginState } from '../utils/auth';
import { logger } from '../utils/log';
import { fetchApi } from './base';
import { getApiCommonParameters } from './common';
import {
  CloudBaseRunImageItem,
  CloudBaseRunServer,
  DomainInfo,
  EnvInfo,
  IServerManageTaskInfo,
  ServiceBaseConfig,
  VersionInfo
} from './interface';

export async function DescribeWxCloudBaseRunDBClusterDetail(data: {
  EnvId: string; // 环境 Id
  WxAppId: string; // 微信 AppId
}): Promise<{
  NetInfo: {
    PrivateNetAddress: string | null; // 内网地址  注意：此字段可能返回 null，表示取不到有效值。
    PubNetAddress: string | null; // 外网地址  注意：此字段可能返回 null，表示取不到有效值。
    Net: string | null; // 网络信息（VPCID/SubnetID）  注意：此字段可能返回 null，表示取不到有效值。
  }; // 网络信息
  DbInfo: {
    IsOpenPubNetAccess: boolean; // 是否开启公网访问
    IsOpenAutoPause: boolean; // 是否开启自动暂停
    AutoPauseDelay: number | null; // 自动暂停延时  注意：此字段可能返回 null，表示取不到有效值。
    Charset: string | null; // 编码  注意：此字段可能返回 null，表示取不到有效值。
    MaxCpu: number | null; // 最大算力  注意：此字段可能返回 null，表示取不到有效值。
    MinCpu: number | null; // 最小算力  注意：此字段可能返回 null，表示取不到有效值。
    Status: string | null; // TDSQL-C集群状态  注意：此字段可能返回 null，表示取不到有效值。
    UsedStorage: number | null; // 存储用量（单位：MB）  注意：此字段可能返回 null，表示取不到有效值。
    StorageLimit: number | null; // 最大存储量（单位：GB）  注意：此字段可能返回 null，表示取不到有效值。
    DbType: string; // 数据库类型
    DbVersion: string; // 数据库类型
    WanStatus: string; //公网访问状态；open开启，opening开启中，closed关闭，closing关闭中
    StrategyUpdateStatus: string; //数据库策略更新状态，doing是正在更新，done是已完成. 注意：此字段可能返回 null，表示取不到有效值。
  }; // 数据库信息
  DbClusterId: string; // db集群id
}> {
  return callCloudApi('DescribeWxCloudBaseRunDBClusterDetail', data);
}

export async function DescribeServiceBaseConfig(data: {
  EnvId: string; // 环境 Id
  ServerName: string; // 服务名
}): Promise<{ ServiceBaseConfig: ServiceBaseConfig }> {
  return callCloudApi('DescribeServiceBaseConfig', data);
}

export async function EstablishCloudBaseRunServer(data: {
  EnvId: string; // 环境id
  ServiceName: string; // 服务名称
  IsPublic: boolean; // 是否开通外网访问
}): Promise<{}> {
  return callCloudApi('EstablishCloudBaseRunServer', data);
}

export async function EstablishCloudBaseRunServerWx(data: {
  EnvId: string; // 环境id
  ServiceName: string; // 服务名称
  IsPublic: boolean; // 是否开通外网访问
  PublicAccess?: number; // 0/1=允许公网访问;2=关闭公网访问
  OpenAccessTypes?: string[]; // OA PUBLIC MINIAPP VPC
}): Promise<{}> {
  return callCloudApi('EstablishCloudBaseRunServerWx', data);
}

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
  return callCloudApi('DescribeCloudBaseBuildService', data);
}

export async function DescribeCloudBaseRunServiceDomain(params: {
  EnvId: string;
  ServiceName: string;
}): Promise<{
  DefaultPublicDomain: string; // 默认公网服务域名
  DefaultInternalDomain: string; // 默认内网服务域名
  AccessTypes: string[]; // 访问类型
  RequestId: string; // 唯一请求 ID，每次请求都会返回。定位问题时需要提供该次请求的 RequestId。
}> {
  const { appid } = await readLoginState();
  return callCloudApi('DescribeCloudBaseRunServiceDomain', params);
}

export async function DescribeWxCloudBaseRunEnvs(): Promise<{
  EnvList: EnvInfo[];
}> {
  const { appid } = await readLoginState();
  return callCloudApi('DescribeWxCloudBaseRunEnvs', { WxAppId: appid });
}

export async function DescribeCloudBaseRunServerVersion(params: {
  EnvId: string;
  ServerName: string;
  VersionName: string;
}): Promise<VersionInfo> {
  return callCloudApi('DescribeCloudBaseRunServerVersion', params);
}

export async function DescribeCloudBaseRunServer(params: {
  EnvId: string;
  ServerName: string;
  VersionName?: string;
  Offset: number;
  Limit: number;
}): Promise<CloudBaseRunServer> {
  return callCloudApi('DescribeCloudBaseRunServer', params);
}

export async function DescribeCloudBaseRunServers(params: {
  EnvId: string;
  Offset: number;
  Limit: number;
  ServerName?: string;
}): Promise<{
  CloudBaseRunServerSet: CloudBaseRunServer[];
}> {
  return callCloudApi('DescribeCloudBaseRunServers', params);
}

export async function SubmitServerRelease(params: {
  BuildDir: string;
  DeployType: string;
  Dockerfile: string;
  EnvId: string;
  HasDockerfile: boolean;
  PackageName?: string;
  PackageVersion?: string;
  ImageUrl?: string;
  Port: number;
  ReleaseType: string;
  ServerName: string;
  WxAppId: string;
}): Promise<{
  Result: string;
  RunId: string;
  VersionName: string;
}> {
  return callCloudApi('SubmitServerRelease', params);
}

export async function CreateCloudBaseRunServerVersion(params: {
  BuildDir: string;
  ContainerPort: number;
  Cpu: number;
  CustomLogs?: string;
  DockerfilePath: string;
  EntryPoint?: string;
  EnvId: string;
  EnvParams: string;
  FlowRatio: number;
  HasDockerfile?: number;
  ImageInfo?: any;
  MaxNum: number;
  Mem: number;
  MinNum: number;
  MountWxToken: boolean;
  PackageName?: string;
  PackageVersion?: string;
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
  return callCloudApi('CreateCloudBaseRunServerVersion', params);
}

export async function SubmitServerRollback(params: {
  EnvId: string;
  CurrentVersionName: string;
  RollbackVersionName: string;
  ServerName: string;
}): Promise<{
  TaskId: string;
  RequestId: string;
}> {
  const { appid } = await readLoginState();
  return callCloudApi('SubmitServerRollback', { ...params, WxAppId: appid });
}

export async function DescribeCloudBaseRunBuildLog(params: {
  EnvId: string;
  ServiceVersion: string;
  BuildId: number;
}): Promise<{
  Log: {
    Total: number;
    Delivered: number;
    Text: string;
    More: boolean;
  };
  RequestId: string;
}> {
  return callCloudApi('DescribeCloudBaseRunBuildLog', params);
}

export async function DescribeCloudBaseRunProcessLog(params: {
  EnvId: string;
  RunId: string;
}): Promise<{ Logs: string[]; RequestId: string }> {
  return callCloudApi('DescribeCloudBaseRunProcessLog', params);
}

export async function SearchClsLog(params: {
  EnvId: string;
  StartTime: string;
  EndTime: string;
  QueryString: string;
  Limit: number;
}): Promise<{
  LogResults: {
    Context: string;
    ListOver: string;
    Results: any[];
  };
  RequestId: string;
}> {
  return callCloudApi('SearchClsLog', params);
}

export async function DescribeServerManageTask(params: {
  EnvId: string;
  ServerName: string;
  TaskId?: number;
}): Promise<{
  Task: IServerManageTaskInfo;
  IsExist: boolean;
  RequestId: string;
}> {
  return callCloudApi('DescribeServerManageTask', params);
}

export async function DescribeCustomDomains(params: { EnvId?: string; Domain?: string }): Promise<{
  DomainList: DomainInfo[];
  RequestId: string;
}> {
  return callCloudApi('DescribeCustomDomains', params);
}

export async function UpdateServerBaseConfig(params: {
  EnvId: string;
  ServerName: string;
  Conf: ServiceBaseConfig;
}): Promise<{}> {
  const { appid } = await readLoginState();
  return callCloudApi('UpdateServerBaseConfig', {
    ...params,
    WxAppId: appid
  });
}

export async function DescribeCloudBaseRunImages(params: {
  EnvId: string;
  ServiceName: string;
}): Promise<{
  Images: CloudBaseRunImageItem[];
  TotalCount?: number;
}> {
  return callCloudApi('DescribeCloudBaseRunImages', params);
}

export async function callCloudApi(action: string, data: Object) {
  const res = await fetchApi('wxa-dev-qbase/apihttpagent', {
    action,
    postdata: JSON.stringify(data),
    region: getApiCommonParameters().region ?? '',
    service: 'tcb',
    version: '2018-06-08'
  });
  if (res?.base_resp?.ret === 0) {
    const response = JSON.parse(res.content);
    if (response.Response?.Error) {
      logger.debug(action);
      logger.debug(data);
      logger.debug(response);
      const error = response.Response.Error;
      console.log({
        code: error?.Code,
        errmsg: error?.Message,
        data: null
      });
      throw error;
    }
    return response?.Response;
  } else {
    console.log({
      code: res?.base_resp?.ret,
      errmsg: res?.base_resp?.errmsg,
      data: null
    });
    throw res?.base_resp;
  }
}
