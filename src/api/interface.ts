export interface VersionInfo {
  BaseImage: string;
  Branch: string;
  BuildDir: string;
  ContainerPort: number;
  Cpu: number;
  CpuSize: number;
  CreatedTime: string;
  CustomLogs: string;
  DockerfilePath: string;
  EntryPoint: string;
  EnvParams: string; // '{"MYSQL_ADDRESS":"10.0.224.14:3306","MYSQL_PASSWORD":"19950131@wwj","MYSQL_USERNAME":"root"}';
  HasDockerfile: number;
  ImageUrl: string;
  InitialDelaySeconds: number;
  IsPublic: boolean;
  MaxNum: number;
  Mem: number;
  MemSize: number;
  MinNum: number;
  MountWxToken: boolean;
  PackageName: string;
  PackageVersion: string;
  PolicyDetail: any[];
  PolicyThreshold: number;
  PolicyType: string;
  Remark: string;
  Repo: string;
  RepoLanguage: string;
  RepoType: string;
  RequestId: string;
  ServerName: string;
  Status: string;
  SubnetIds: string[];
  UpdatedTime: string;
  UploadType: string;
  VersionIP: string;
  VersionName: string;
  VersionPort: number;
  VpcId: string;
}

export interface EnvInfo {
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
}

export interface CloudBaseRunServer {
  ImageRepo: string;
  IsPublic: true;
  RequestId: string;
  ServerName: string;
  SourceType: string;
  TotalCount: number;
  TrafficType: string;
  CreatedTime: string;
  UpdatedTime: string;
  Status: string;
  VersionItems: VersionItems[];
}

export interface VersionItems {
  Architecture: string;
  BuildId: number;
  CreatedTime: string;
  CurrentReplicas: number;
  FlowParams: any;
  FlowRatio: number;
  IsDefaultPriority: boolean;
  MaxReplicas: number;
  MinReplicas: number;
  Percent: number;
  Priority: number;
  Remark: string;
  RunId: string;
  Status: string;
  UpdatedTime: string;
  UploadType: string;
  UrlParam: { Key: string; Value: string };
  VersionName: string;
}

export interface IOneClickTaskStepInfo {
  /** 未启动："todo"
运行中："running"
失败："failed"
成功结束："finished" */
  Status: string;
  /** 开始时间 */
  StartTime: string;
  /** 结束时间 */
  EndTime: string;
  /** 耗时：秒 */
  CostTime: number;
  /** 失败原因 */
  FailReason: string;
  /** 步骤名 */
  Name: string;
}
/** 服务管理任务信息 */
export interface IServerManageTaskInfo {
  /** 任务Id */
  Id: number;
  /** 环境Id */
  EnvId: string;
  /** 服务名 */
  ServerName: string;
  /** 创建时间 */
  CreateTime: string;
  /** 变更类型CONFIG/ROLLBACK/CODE */
  ChangeType: string;
  /** 部署类型package/repository/image/pipeline */
  DeployType: string;
  /** 发布类型 GRAY/FULL */
  ReleaseType: string;
  /** 回滚前版本 */
  PreVersionName: string;
  /** 当前版本 */
  VersionName: string;
  /** 流水线Id */
  PipelineId: number;
  /** 流水线任务Id */
  PipelineTaskId: number;
  /** 发布Id */
  ReleaseId: number;
  /** 状态 */
  Status: string;
  /** 步骤状态 */
  Steps: IOneClickTaskStepInfo[];
  /** 操作人状态 */
  OperatorRemark: string;
  /** 失败原因 */
  FailReason: string;
}

export interface DomainInfo {
  /** 域名 */
  Domain: string;
  /** 后端服务名称 */
  ServiceName: string;
  /** 用户环境ID */
  EnvId: string;
  /** http or https */
  Protocol: string;
  /** 证书id,https时必传 */
  CertId: string;
  /** 域名id */
  ID: number;
  /** 回源域名 */
  CName: string;
  /** 域名操作状态todo(等待),done(成功),fail(失败) */
  Status: string;
  /** 证书到期时间 */
  ExpireTime: string;
}

export interface ServiceBaseConfig {
  /** 环境id */
  EnvId?: string;
  /** 服务名称 */
  ServerName?: string;
  /** 是否开启公网访问 */
  PublicAccess: boolean;
  /** Cpu 规格 */
  Cpu: number;
  /** Mem 规格 */
  Mem: number;
  /** 最小副本数 */
  MinNum: number;
  /** 最大副本数 */
  MaxNum: number;
  /** 扩缩容条件 */
  PolicyType: string;
  /** 扩缩容阈值 */
  PolicyThreshold: number;
  /** 日志采集路径 */
  CustomLogs: string;
  /** 环境变量 */
  EnvParams: string;
  /** 微信透传参数 */
  OperatorRemark: string;
  /** 延迟检测时间 */
  InitialDelaySeconds: number;
  /** 创建时间 */
  CreateTime?: string;
}

export interface CloudBaseRunImageItem {
  /** 镜像地址 */
  ImageUrl: string;
  /** 镜像tag */
  Tag: string;
  /** 创建时间 */
  CreateTime: string;
  /** 更新时间 */
  UpdateTime: string;
  /** 关联版本 */
  ReferVersions: CloudBaseRunVersionItem[];
  /** 镜像大小 */
  Size: string;
}
/** 服务版本 */
export interface CloudBaseRunVersionItem {
  /** 环境id */
  EnvId: string;
  /** 服务名称 */
  ServiceName: string;
  /** 服务版本名称 */
  VersionName: string;
}
