import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import * as fs from "fs";
import { checkLoginState, saveLoginState } from "../utils/auth";

export default class LogoutCommand extends Command {
  static description = "登出 CLI";

  static examples = [`wxcloud logout`];

  static flags = {
    help: flags.help({ char: "h" }),
  };

  async run() {
      
  }
}
