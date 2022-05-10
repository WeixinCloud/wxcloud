import { Command, flags } from "@oclif/command";
import { DescribeWxCloudBaseRunEnvs } from "../../api";
import { ApiRegion, setApiCommonParameters } from "../../api/common";
import { execWithLoading } from "../../utils/loading";
import { printHorizontalTable } from "../../utils/ux";
import { REGION_COMMAND_FLAG } from "../../utils/flags";

export default class ListEnvCommand extends Command {
  static description = "查看环境列表";

  static examples = [`wxcloud env:list`];

  static flags = {
    help: flags.help({ char: "h", description: "查看帮助" }),
    region: REGION_COMMAND_FLAG,
    json: flags.boolean({
      description: "是否以json格式展示结果",
      default: false,
    }),
  };

  async run() {
    const { flags } = this.parse(ListEnvCommand);

    setApiCommonParameters({ region: flags.region as ApiRegion });

    const { EnvList } = await execWithLoading(
      () => DescribeWxCloudBaseRunEnvs(),
      {
        startTip: "获取环境列表中...",
        failTip: "获取环境列表失败，请重试！",
      }
    );
    if (flags.json) {
      const result = {
        code: 0,
        errmsg: "success",
        data: EnvList.map(({ Alias, EnvId, CreateTime }) => ({
          Alias,
          EnvId,
          CreateTime,
        })),
      };
      this.log(JSON.stringify(result));
    } else {
      const head = ["环境名称", "环境 Id", "创建时间"];
      const tableData = EnvList.map(({ Alias, EnvId, CreateTime }) => [
        Alias,
        EnvId,
        CreateTime,
      ]);
      printHorizontalTable(head, tableData);
    }
  }
}
