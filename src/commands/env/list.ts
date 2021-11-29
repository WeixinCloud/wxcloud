import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import { callCloudApi } from "../../api/cloudapi";
import { DescribeWxCloudBaseRunEnvs } from "../../api";

export default class ListEnvCommand extends Command {
  static description = "describe the command here";

  static examples = [`wxcloud env:list`];

  static flags = {
    help: flags.help({ char: "h" }),
  };

  async run() {
    const res = await DescribeWxCloudBaseRunEnvs();
    const envList = res.EnvList
    cli.table(
      envList,
      {
        Alias: {
          header: "环境名称",
        },
        EnvId: {
          header: "环境ID",
        },
        CreateTime: {
          header: "创建时间",
        },
      },
      {
        printLine: this.log,
        ...flags, // parsed flags
      }
    );
  }
}
