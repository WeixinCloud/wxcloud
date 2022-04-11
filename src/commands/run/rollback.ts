import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import {
  DescribeCloudBaseRunServer,
  SubmitServerRollback,
} from "../../api/cloudapi";
import { execWithLoading } from "../../utils/loading";
import {
  chooseEnvId,
  chooseServiceId,
  chooseVersionName,
} from "../../utils/ux";

export default class RunRollbackCommand extends Command {
  static description = "版本回退";

  static examples = ["wxcloud run:rollback"];

  static flags = {
    help: flags.help({ char: "h", description: "查看帮助" }),
    noConfirm: flags.boolean({
      description: "发布前是否跳过二次确认",
      default: false,
    }),
    detach: flags.boolean({ description: "是否直接返回，不显示部署日志" }),
    envId: flags.string({ char: "e", description: "环境ID" }),
    serviceName: flags.string({ char: "s", description: "服务名称" }),
    version: flags.string({ char: "v", description: "回退版本" }),
  };

  async run() {
    const { flags } = this.parse(RunRollbackCommand);
    const envId = flags.envId || (await chooseEnvId());
    const serviceName = flags.serviceName || (await chooseServiceId(envId));
    const { versionList, currentVersion } = await execWithLoading(
      async () => {
        const { VersionItems } = await DescribeCloudBaseRunServer({
          EnvId: envId,
          ServerName: serviceName,
          Offset: 0,
          Limit: 100,
        });
        const currentVersion = VersionItems?.find(
          ({ FlowRatio, IsDefaultPriority }) =>
            FlowRatio === 100 || IsDefaultPriority
        );
        const versionList = VersionItems.filter(
          ({ VersionName }) => VersionName !== currentVersion?.VersionName
        )
          .filter(({ Status }) => Status === "normal")
          .filter(
            ({ VersionName }) =>
              VersionName < (currentVersion?.VersionName || "")
          );
        return {
          versionList,
          currentVersion,
        };
      },
      {
        startTip: "获取版本列表中...",
        failTip: "获取版本列表失败，请重试！",
      }
    );
    const versionName =
      flags.version || (await chooseVersionName({ versionList }));
    if (flags.noConfirm || (await cli.confirm("确定回退？(请输入yes或no)"))) {
      await execWithLoading(
        () =>
          SubmitServerRollback({
            EnvId: envId,
            ServerName: serviceName,
            CurrentVersionName: currentVersion.VersionName,
            RollbackVersionName: versionName,
          }),
        {
          startTip: "版本回退中...",
          successTip: "版本回退成功",
          failTip: "版本回退失败，请重试！",
        }
      );
    } else {
      this.log("取消回退");
    }
  }
}
