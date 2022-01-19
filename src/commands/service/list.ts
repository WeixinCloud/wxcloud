import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import { callCloudApi } from "../../api/cloudapi";
import {
  DescribeCloudBaseRunServers,
  DescribeWxCloudBaseRunEnvs,
} from "../../api";
import { chooseEnvId } from "../../utils/ux";

export default class ListServiceCommand extends Command {
  static description = "获取服务列表";

  static examples = [`wxcloud service:list`];

  static flags = {
    help: flags.help({ char: "h" }),
    envId: flags.string({ char: "e" }),
    page: flags.string({ char: "p" }),
  };

  async run() {
    const { args, flags } = this.parse(ListServiceCommand);
    const envId = flags.envId || (await chooseEnvId());
    const res = await DescribeCloudBaseRunServers({
      EnvId: envId,
      Limit: 10,
      Offset: parseInt(flags.page as string) || 0,
    });
    const serviceList = res.CloudBaseRunServerSet;
    // console.log(await callCloudApi("DescribeCloudBaseBuildService", {
    //   EnvId: "env01-9gdi9qsa33fa4f83",
    //   ServiceName: "my-first-service"
    // }))
    cli.table(
      serviceList,
      {
        ServerName: {
          header: "服务名称",
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
