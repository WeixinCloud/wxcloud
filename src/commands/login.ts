import { Command, flags } from "@oclif/command";
import * as path from 'path'
import cli from "cli-ux";
import * as fs from "fs";
import {
  checkLoginState,
  openQrCodeLogin,
  saveLoginState,
  waitForQrCodeLoginResult,
} from "../utils/auth";
import axios from "axios";

export default class LoginCommand extends Command {
  static description = "登录 CLI 工具";

  static examples = [`$ wxcloud login --appid <appid>`];

  static flags = {
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    appid: flags.string({ char: "a", description: "微信 AppID" }),
    private_key_path: flags.string({ char: "k", description: "微信云服务私钥" }),
  };

  async run() {
    const { args, flags } = this.parse(LoginCommand);
    if (flags.private_key_path) {
      return this.loginWithPrivateKey();
    } else {
      return this.loginWithQrCode();
    }
  }

  async loginWithQrCode() {
    const randstr = await openQrCodeLogin();
    cli.action.start("等待扫码登录结果……");
    const { accessToken, refreshToken } = await waitForQrCodeLoginResult(
      randstr,
      30 * 1000
    );
    cli.action.stop();
    this.log("✅登录成功");
    console.log({ accessToken, refreshToken });
      // saveLoginToken();
  }

  async loginWithPrivateKey() {
    const { args, flags } = this.parse(LoginCommand);
    const privateKeyPath = flags.private_key_path as string;
    const appid: string = flags.appid || (await cli.prompt("请输入微信 AppID"));
    const privateKeyAbsolutePath = path.resolve(process.cwd(), privateKeyPath);

    cli.action.start("登录中");
    const isValid = await checkLoginState(appid, privateKeyAbsolutePath);
    cli.action.stop();

    if (isValid) {
      await saveLoginState(appid, privateKeyAbsolutePath);
      this.log("✅登录成功");
    } else {
      this.error("❌登录失败，请检查 AppID 与私钥文件是否正确");
    }
  }
}
