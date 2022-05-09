import { Command, flags } from "@oclif/command";
import * as CloudKit from "@wxcloud/cloudkit";

export default class DeployCommand extends Command {
  static description = "Unified Deploy";

  static examples = [`wxcloud deploy`];

  static flags = {};

  async run() {
    // testing monorepo
    const res = CloudKit.foo(1, 2);
    console.log(res);
  }
}
