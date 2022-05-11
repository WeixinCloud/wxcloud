import { CloudConfig } from "./cloudconfig";

export enum KitType {
  UNIVERSAL = "universal",
  RUN = "run",
  STATIC = "static",
}
export interface IKitContext {
  fullPath: string;
  config: CloudConfig;
  staticDomain?: string;
}
export interface IKitDeployTarget {
  staticTarget?: string[];
  runTarget?: string[];
}
export abstract class Kit {
  static description: string | undefined;
  static type: KitType;
  abstract run(ctx: IKitContext): Promise<IKitDeployTarget | void>;
  abstract detect(ctx: IKitContext): Promise<boolean> | boolean;
}
