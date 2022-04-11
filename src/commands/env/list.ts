import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import { DescribeWxCloudBaseRunEnvs } from "../../api";
import { execWithLoading } from "../../utils/loading";

export default class ListEnvCommand extends Command {
  static description = "查看环境列表";

  static examples = [`wxcloud env:list`];

  static flags = {
    help: flags.help({ char: "h", description: "查看帮助" }),
    json: flags.boolean({
      description: "是否以json格式展示结果",
      default: false,
    }),
  };

  async run() {
    const { flags } = this.parse(ListEnvCommand);
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
      cli.table(
        EnvList,
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
}
