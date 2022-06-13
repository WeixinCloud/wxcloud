import ext from '../global';
import { withTimeoutAndCancellationToken as $ } from '../../utils/utils';
import type {
  IBackendService,
  INotifyOptions,
  IEnsureDebugServerOptions,
  IGetEnvListResult,
  IQueryServiceResult,
  IDeployServiceResult,
  IQueryServiceOptions,
  IDeployServiceOptions
} from './backend';

export class IDEBackendService implements IBackendService {
  type = 'ide';

  notify(opt: INotifyOptions): void {
    ext.messenger.invoke(opt.type, opt.data);
  }
  async getExtList() {
    return {
      services: []
    };
  }
  async attachService(data: any): Promise<void> {
    return $(() => ext.messenger.invoke('ATTACH_WX_SERVICE', data)) as any;
  }
  async detachService(data: any): Promise<void> {
    return $(() => ext.messenger.invoke('DETACH_WX_SERVICE', data)) as any;
  }

  ensureDebugServer(_opt: IEnsureDebugServerOptions): Promise<void> {
    return Promise.resolve();
  }

  getEnvList(): Promise<IGetEnvListResult> {
    return $(() => ext.messenger.invoke('GET_ENV_LIST', {})) as any;
  }

  queryService(opt: IQueryServiceOptions): Promise<IQueryServiceResult> {
    return $(() => ext.messenger.invoke('QUERY_SERVICE', opt)) as any;
  }

  deployService(opt: IDeployServiceOptions): Promise<IDeployServiceResult> {
    return ext.messenger.invoke('DEPLOY_SERVICE', opt);
  }
}
