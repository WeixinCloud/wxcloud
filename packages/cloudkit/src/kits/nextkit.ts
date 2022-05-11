import { exec } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { IKitContext, IKitDeployTarget, Kit, KitType } from "../common/kit";
import { RunKit } from "./runkit";

export class NextKit extends Kit {
  static description = "CloudKit for Next.js";
  static type = KitType.UNIVERSAL;
  static deployTarget = [".next/static", "public"];
  detect(ctx: IKitContext): boolean | Promise<boolean> {
    const packageJson = require(path.join(ctx.fullPath, "package.json"));
    return !!packageJson.dependencies.next;
  }
  async run(ctx: IKitContext): Promise<IKitDeployTarget> {
    // patch next.config.js
    const nextConfigPath = path.join(ctx.fullPath, "next.config.js");
    const nextConfig = require(nextConfigPath);
    if (!ctx.staticDomain) {
      throw new Error("staticDomain is required using NextKit.");
    }
    if (!nextConfig.assetPrefix) {
      console.log("patching next.config.js for CDN assets.");
      nextConfig.assetPrefix = ctx.staticDomain;
      writeFileSync(nextConfigPath, JSON.stringify(nextConfig, null, 2));
    }
    exec(`cd ${ctx.fullPath} && npm run build`, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(stdout);
      console.log(stderr);
    });
    // execute runkit
    const runKit = new RunKit();
    runKit.detect(ctx);
    const runKitResult = await runKit.run(ctx);
    return {
      ...runKitResult,
      staticTarget: NextKit.deployTarget,
    };
  }
}
