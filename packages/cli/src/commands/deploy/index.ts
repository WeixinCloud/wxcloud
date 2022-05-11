import { Command, flags } from "@oclif/command";
import * as CloudKit from "@wxcloud/cloudkit";
import path from "node:path";

function extractCloudConfig(): CloudKit.CloudConfig {
  const cwd = process.cwd();
  const configFile = path.join(cwd, "wxcloud.config.js");
  const config = require(configFile);
  return (
    config || {
      type: "run",
      server: ",",
    }
  );
}
export default class DeployCommand extends Command {
  static description = "Unified Deploy";

  static examples = [`wxcloud deploy`];

  static flags = {};

  async run() {
    const cloudConfig = extractCloudConfig();
    CloudKit.execAllKits({
      fullPath: process.cwd(),
      config: cloudConfig,
    });
  }
}
