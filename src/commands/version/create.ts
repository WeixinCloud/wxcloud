import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import { callCloudApi } from "../../api/cloudapi";
import { DescribeCloudBaseBuildService } from "../../api";
import { chooseEnvId } from "../../utils/ux";

export default class VersionCreateCommand extends Command {
  static description = "创建版本";

  static examples = [`wxcloud version:create`];

  static flags = {
    help: flags.help({ char: "h" }),
    envId: flags.string({ char: "e" }),
    serviceName: flags.string({ char: "s" })
  };

  async run() {
    const { args, flags } = this.parse(VersionCreateCommand);
    const envId = flags.envId || (await chooseEnvId());
    const serviceName = flags.serviceName || (await cli.prompt("请输入服务名"));
    const res = await DescribeCloudBaseBuildService({ EnvId: envId, ServiceName: serviceName });
    console.log(res);
  }
}
