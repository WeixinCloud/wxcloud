import { exec } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { IKitContext, IKitDeployTarget, Kit, KitType } from "../common/kit";
import { RunKit } from "./runkit";

export class NextKit extends Kit {
  static description = "CloudKit for Next.js";
  static type = KitType.UNIVERSAL;
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
      // backup old next.config.js
      writeFileSync(
        path.join(ctx.fullPath, "next.config.js.bak"),
        readFileSync(nextConfigPath)
      );
      console.log("patching next.config.js for CDN assets.");
      nextConfig.assetPrefix = ctx.staticDomain;
      writeFileSync(
        nextConfigPath,
        `module.exports = ${JSON.stringify(nextConfig)}`
      );
    }
    const execp = promisify(exec);
    const result = await execp(`cd ${ctx.fullPath} && npm run build`);
    if (result.stderr) {
      throw new Error(result.stderr);
    }
    console.log(result.stdout);
    // restore user next.config.js
    if (existsSync(path.join(ctx.fullPath, "next.config.js.bak"))) {
      writeFileSync(
        nextConfigPath,
        readFileSync(path.join(ctx.fullPath, "next.config.js.bak"))
      );
      unlinkSync(path.join(ctx.fullPath, "next.config.js.bak"));
    }
    // execute runkit
    const runKit = new RunKit();
    runKit.detect(ctx);
    const runKitResult = await runKit.run(ctx, {
      fileGlob: ["package*.json", ".next/**/*", "Dockerfile"],
    });
    return {
      ...runKitResult,
      staticTarget: {
        public: "",
        ".next/static": "_next/static/",
      },
    };
  }
}
