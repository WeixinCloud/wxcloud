import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import { callCloudApi } from "../../api/cloudapi";
import { DescribeCloudBaseRunServer } from "../../api";
import { chooseEnvId, chooseServiceId } from "../../utils/ux";

export default class ListVersionCommand extends Command {
  static description = "获取版本列表";

  static examples = [`wxcloud version:list`];

  static flags = {
    help: flags.help({ char: "h" }),
    envId: flags.string({ char: "e" }),
    serviceName: flags.string({ char: "s" }),
    page: flags.string({ char: "p" }),
  };

  async run() {
    const { args, flags } = this.parse(ListVersionCommand);
    const envId = flags.envId || (await chooseEnvId());
    const serviceName = flags.serviceName || (await chooseServiceId(envId));
    const res = await DescribeCloudBaseRunServer({
      EnvId: envId,
      ServerName: serviceName,
      Limit: 10,
      Offset: parseInt(flags.page as string) || 0,
    });
    const versionList = res.VersionItems;
    // console.log(await callCloudApi("DescribeCloudBaseBuildService", {
    //   EnvId: "env01-9gdi9qsa33fa4f83",
    //   ServiceName: "my-first-service"
    // }))
    cli.table(
      versionList,
      {
        VersionName: {
          header: "版本名称",
        },
        Status: {
          header: "状态",
        },
        CreatedTime: {
          header: "创建时间",
        },
        UpdatedTime: {
          header: "更新时间",
        },
      },
      {
        printLine: this.log,
        ...flags, // parsed flags
      }
    );
  }
}
