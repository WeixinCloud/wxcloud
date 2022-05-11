import { Kit, KitType, IKitContext, IKitDeployTarget } from "../common/kit";

export class RunKit extends Kit {
  static type = KitType.RUN;
  static description = "RunKit";
  async run(
    ctx: IKitContext & {
      filter?: string[] | string;
    }
  ): Promise<IKitDeployTarget> {
    return {
      staticTarget: ["."],
    };
  }
  async detect(ctx: IKitContext) {
    return true;
  }
}
