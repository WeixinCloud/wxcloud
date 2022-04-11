import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import {
  DescribeCloudBaseRunServers,
  DescribeCloudBaseRunServiceDomain,
} from "../../api";
import { chooseEnvId } from "../../utils/ux";
import { execWithLoading } from "../../utils/loading";

export default class ListServiceCommand extends Command {
  static description = "获取服务列表";

  static examples = ["wxcloud service:list"];

  static flags = {
    help: flags.help({ char: "h", description: "查看帮助" }),
    envId: flags.string({ char: "e", description: "环境ID" }),
    serviceName: flags.string({ char: "s", description: "服务名称" }),
    page: flags.string({ char: "p" }),
    json: flags.boolean({
      description: "是否以json格式展示结果",
      default: false,
    }),
  };

  async run() {
    const { flags } = this.parse(ListServiceCommand);
    const envId = flags.envId || (await chooseEnvId());
    const serviceName = flags.serviceName;
    const CloudBaseRunServerInfo = await execWithLoading(
      async () => {
        const { CloudBaseRunServerSet } = await DescribeCloudBaseRunServers({
          EnvId: envId,
          ServerName: serviceName,
          Limit: 10,
          Offset: parseInt(flags.page, 10) || 0,
        });

        const CloudBaseRunServiceDomains = await Promise.all(
          CloudBaseRunServerSet.map(async ({ ServerName }) => {
            const CloudBaseRunServiceDomain =
              await DescribeCloudBaseRunServiceDomain({
                EnvId: envId,
                ServiceName: ServerName,
              });
            return { ...CloudBaseRunServiceDomain, ServerName };
          })
        );
        return CloudBaseRunServerSet.map((CloudBaseRunServer) => {
          const { AccessTypes, DefaultPublicDomain } =
            CloudBaseRunServiceDomains.find(
              (item) => CloudBaseRunServer?.ServerName === item?.ServerName
            );
          return {
            ...CloudBaseRunServer,
            IsPublicAccess: AccessTypes.includes("PUBLIC"),
            DefaultPublicDomain,
          };
        });
      },
      {
        startTip: "获取服务列表中...",
        failTip: "获取服务列表失败，请重试！",
      }
    );
    if (flags.json) {
      const result = {
        code: 0,
        errmsg: "success",
        data: CloudBaseRunServerInfo.map(
          ({ ServerName, Status, CreatedTime, UpdatedTime }) => ({
            ServerName,
            Status,
            CreatedTime,
            UpdatedTime,
          })
        ),
      };
      this.log(JSON.stringify(result));
    } else {
      cli.table(
        CloudBaseRunServerInfo,
        {
          ServerName: {
            header: "服务名称",
          },
          Status: {
            header: "状态",
            minWidth: 15,
          },
          isPublic: {
            header: "公网访问",
            minWidth: 15,
            get: ({ IsPublicAccess }) => (IsPublicAccess ? "是" : "否"),
          },
          DefaultPublicDomain: {
            header: "服务域名",
            minWidth: 30,
            get: ({ DefaultPublicDomain, IsPublicAccess }) =>
              IsPublicAccess ? DefaultPublicDomain : "-",
          },
          CreatedTime: {
            header: "创建时间",
            minWidth: 15,
          },
          UpdatedTime: {
            header: "更新时间",
            minWidth: 15,
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
