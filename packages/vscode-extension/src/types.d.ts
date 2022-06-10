import type * as vscode from 'vscode';
import type * as Dockerode from 'dockerode';

export interface IWXContainerId {
  type: 'local' | 'proxy' | 'credentials' | 'debugServer' | 'running'
  name: string
  ip?: string
  folder?: boolean
  attached?: boolean
  mode?: string
}

export interface IWXContainerInfo {
  name: string
  path: string
  uri: vscode.Uri
  location: string // cloudfunctionRoot
  hostPort?: number // for debug
  container?: Dockerode.ContainerInfo
  config?: IContainerConfigJSON
  missingContainerConfigFile?: boolean
  onlineInfo?: any
  mode?: 'compose' | 'docker'
}

export interface IDebugConfig {
  containers: {
    name: string
    containerId?: string
    domain?: string
    ip?: string
    mode?: 'compose' | 'docker'
  }[]
  config: Record<string, IContainerConfigJSON>
}

export interface IWXDebugProxyContainerInfo {
  name: string
  container?: Dockerode.ContainerInfo
}

interface IWXServerInfo {
  port: string
  mounts: {
    type: string
    path: string
  }[]
}

export interface IContainerConfigJSON {
  // ==== 来自 tcbDescribeCloudBaseRunServerVersion 的字段
  remark?: string // 备注  注意：此字段可能返回 null，表示取不到有效值。
  dockerfilePath?: string // Dockefile的路径  注意：此字段可能返回 null，表示取不到有效值。
  buildDir: string // DockerBuild的目录  注意：此字段可能返回 null，表示取不到有效值。
  cpu: number // Cpu的大小
  mem: number // Mem的大小
  minNum: number // 副本最小值
  maxNum: number // 副本最大值
  policyType: string // 扩缩容策略类型
  policyThreshold: number // 策略阈值
  envParams?: Record<string, any> // 环境变量  特殊注意：接口要求字符串，只是 JSON 允许对象
  // createdTime: string // 创建时间
  // updatedTime: string // 更新时间
  // versionIp?: string // 版本的IP  注意：此字段可能返回 null，表示取不到有效值。
  // versionPort?: number // 版本的端口号  注意：此字段可能返回 null，表示取不到有效值。
  // status?: string // 版本状态  注意：此字段可能返回 null，表示取不到有效值。
  // packageName?: string // 代码包的名字  注意：此字段可能返回 null，表示取不到有效值。
  // packageVersion?: string // 代码版本的名字  注意：此字段可能返回 null，表示取不到有效值。
  // uploadType?: string // 枚举（package/repository/image)  注意：此字段可能返回 null，表示取不到有效值。
  // repoType?: string // Repo的类型(coding/gitlab/github/coding)  注意：此字段可能返回 null，表示取不到有效值。
  // repo?: string // 地址  注意：此字段可能返回 null，表示取不到有效值。
  // branch?: string // 分支  注意：此字段可能返回 null，表示取不到有效值。
  // serverName?: string // 服务名字  注意：此字段可能返回 null，表示取不到有效值。
  // isPublic?: boolean // 是否对于外网开放  注意：此字段可能返回 null，表示取不到有效值。
  // vpcId?: string // vpc id  注意：此字段可能返回 null，表示取不到有效值。
  // subnetIds?: string[] // 子网实例id  注意：此字段可能返回 null，表示取不到有效值。
  customLogs?: string // 日志采集路径  注意：此字段可能返回 null，表示取不到有效值。
  containerPort?: number // 监听端口  注意：此字段可能返回 null，表示取不到有效值。
  initialDelaySeconds?: number // 延迟多长时间开始健康检查（单位s）  注意：此字段可能返回 null，表示取不到有效值。
  // imageUrl?: string // 镜像地址  注意：此字段可能返回 null，表示取不到有效值。

  // === 来自 tcbDescribeCloudBaseRunServer 的字段 ===
  flowRatio?: number // 流量配比
}

export interface IConfiguration {
  vpcProxyNodes: string[]
  vpcProxyTargetEnvId: string
  proxy?: string
  appid?: string
  ciKey?: string
  cliKey?: string
  ports: {
    host: number
    wx: number
  }
}
