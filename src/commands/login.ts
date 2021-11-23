import { Command, flags } from "@oclif/command";
import cli from "cli-ux";
import * as fs from "fs";
import { checkLoginState, saveLoginState } from "../utils/auth";

export default class LoginCommand extends Command {
  static description = "登录 CLI 工具";

  static examples = [`$ wxcloud login --appid <appid>`];

  static flags = {
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    appid: flags.string({ char: "a", description: "微信 AppID" }),
    private_key: flags.string({ char: "k", description: "微信云服务私钥" }),
  };

  async run() {
    const { args, flags } = this.parse(LoginCommand);
    let { private_key } = flags;
    const appid: string = flags.appid || (await cli.prompt("请输入微信 AppID"));
    const privateKeyPath =
      flags.private_key || (await cli.prompt("请输入微信云服务私钥所在路径"));
    const privateKey = await fs.promises.readFile(privateKeyPath, 'utf8');

    cli.action.start("登录中");
    const isValid = await checkLoginState(appid, privateKey)
    cli.action.stop();

    if (isValid) {
      await saveLoginState(appid, privateKey);
      this.log("✅登录成功");
    } else {
      this.error("❌登录失败，请检查 AppID 与私钥文件是否正确");
    }
  }
}
