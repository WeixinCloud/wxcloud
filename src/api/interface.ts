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
  VersionItems: VersionItems[];
}

export interface VersionItems {
  Architecture: string;
  BuildId: number;
  CreatedTime: string;
  CurrentReplicas: number;
  FlowParams: any;
  FlowRatio: string;
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
