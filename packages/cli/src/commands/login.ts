import { Command, flags } from '@oclif/command';
import cli from 'cli-ux';
import {
  checkLoginState,
  openQrCodeLogin,
  saveLoginState,
  waitForQrCodeLoginResult
} from '../utils/auth';

export default class LoginCommand extends Command {
  static description = '登录 CLI 工具';

  static examples = [`$ wxcloud login --appid <appid>`];

  static flags = {
    help: flags.help({ char: 'h' }),
    // flag with a value (-n, --name=VALUE)
    appId: flags.string({ char: 'a', description: '微信 AppID' }),
    privateKey: flags.string({ char: 'k', description: '微信云服务私钥' })
  };

  async run() {
    const { args, flags } = this.parse(LoginCommand);
    return this.loginWithPrivateKey();
  }

  async loginWithQrCode() {
    const randstr = await openQrCodeLogin();
    cli.action.start('等待扫码登录结果');
    const { accessToken, refreshToken } = await waitForQrCodeLoginResult(randstr, 30 * 1000);
    cli.action.stop();
    this.log('✅ 登录成功');
    console.log({ accessToken, refreshToken });
    // saveLoginToken();
  }

  async loginWithPrivateKey() {
    const { args, flags } = this.parse(LoginCommand);
    const appid: string = flags.appId || (await cli.prompt('请输入微信 AppID'));
    const privateKey = flags.privateKey || (await cli.prompt('请输入秘钥'));

    cli.action.start('登录中');
    const isValid = await checkLoginState(appid, privateKey);
    cli.action.stop();

    if (isValid) {
      await saveLoginState(appid, privateKey);
      this.log('✅ 登录成功');
    } else {
      this.error('❌ 登录失败，请检查 AppID 与私钥文件是否正确', { exit: 201 });
    }
  }
}
