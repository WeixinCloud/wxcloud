
export interface IBackendService {
  type: string
  init?: (...args: any[]) => any
  notify: (opt: INotifyOptions) => void
  ensureDebugServer: (opt: IEnsureDebugServerOptions) => Promise<any>
  getEnvList: () => Promise<IGetEnvListResult | IErrorResult>
  getExtList: (opt: { envId: string, appid: string }) => Promise<IExtListResult>
  queryService: (opt: IQueryServiceOptions) => Promise<IQueryServiceResult | IErrorResult>
  deployService: (opt: IDeployServiceOptions) => Promise<IDeployServiceResult | IErrorResult>
  attachService: (opt: { wxPort: number, service: string }) => Promise<void>
  detachService: (opt?: { service: string }) => Promise<void>
}

export interface INotifyOptions {
  type: string
  data: any
}

export interface IEnsureDebugServerOptions {
  new?: boolean
  port?: number
}

export interface IErrorResult {
  error: string
}

export interface IGetEnvListResult {
  list: any[]
}

export interface IQueryServiceOptions {
  envId: string
  serviceName: string
}

export interface IQueryServiceResult {
  server: any
  domainInfo: any
  key?: string
}

export interface IDeployServiceOptions {
  envId: string
  path?: string
  serviceName: string
  versionOptions?: any
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IDeployServiceResult {
}

export interface IExtListResult {
  services: {
    name: string
    ip: string
  }[]
}
