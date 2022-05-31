import { CloudConfig } from '@wxcloud/core';

export enum KitType {
  UNIVERSAL = 'universal',
  RUN = 'run',
  STATIC = 'static'
}
export interface IKitContext {
  fullPath: string;
  config: CloudConfig;
  staticDomain?: string;
  port?: number;
  fileToIgnore?: string[];
  lifecycleHooks?: {
    enterStage: (stageName: string, ...info: any) => void;
    leaveStage: (stageName: string, ...info: any) => void;
  };
}
export interface IKitDeployTarget {
  staticTarget?: Record<string, string>;
  runTarget?: string;
}
export abstract class Kit {
  static description: string | undefined;
  static type: KitType;
  abstract run(ctx: IKitContext): Promise<IKitDeployTarget>;
  abstract detect(ctx: IKitContext): Promise<boolean> | boolean;
}
