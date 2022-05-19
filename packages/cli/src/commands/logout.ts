import { Command, flags } from '@oclif/command';
import { removeLoginState } from '../utils/auth';
import { execWithLoading } from '../utils/loading';

export default class LogoutCommand extends Command {
  static description = '登出 CLI';

  static examples = [`wxcloud logout`];

  static flags = {
    help: flags.help({ char: 'h' })
  };

  async run() {
    await execWithLoading(() => removeLoginState(), {
      successTip: '注销登录成功！'
    });
  }
}
