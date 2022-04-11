import { Command, flags } from "@oclif/command";
import { DescribeCloudBaseRunServer } from "../../api";
import {
  chooseEnvId,
  chooseServiceId,
  printHorizontalTable,
} from "../../utils/ux";

export default class ListVersionCommand extends Command {
  static description = "获取版本列表";

  static examples = [`wxcloud version:list`];

  static flags = {
    help: flags.help({ char: "h" }),
    envId: flags.string({ char: "e" }),
    serviceName: flags.string({ char: "s" }),
    page: flags.string({ char: "p" }),
    json: flags.boolean({
      description: "是否以json格式展示结果",
      default: false,
    }),
  };

  async run() {
    const { flags } = this.parse(ListVersionCommand);
    const envId = flags.envId || (await chooseEnvId());
    const serviceName = flags.serviceName || (await chooseServiceId(envId));
    const { VersionItems } = await DescribeCloudBaseRunServer({
      EnvId: envId,
      ServerName: serviceName,
      Limit: 10,
      Offset: parseInt(flags.page) || 0,
    });
    if (flags.json) {
      const result = {
        code: 0,
        errmsg: "success",
        data: VersionItems.map(
          ({ VersionName, Status, CreatedTime, UpdatedTime }) => ({
            VersionName,
            Status,
            CreatedTime,
            UpdatedTime,
          })
        ),
      };
      this.log(JSON.stringify(result));
    } else {
      const head = ["版本名称", "状态", "创建时间", "更新时间"];
      const tableData = VersionItems.map(
        ({ VersionName, Status, CreatedTime, UpdatedTime }) => [
          VersionName,
          Status,
          CreatedTime,
          UpdatedTime,
        ]
      );
      printHorizontalTable(head, tableData);
    }
  }
}
