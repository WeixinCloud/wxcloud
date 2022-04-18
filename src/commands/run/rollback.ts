import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import {
  DescribeCloudBaseRunServer,
  DescribeServerManageTask,
  SubmitServerRollback,
} from "../../api/cloudapi";
import { execWithLoading } from "../../utils/loading";
import { computedBuildLog, computedTaskLog } from "../../utils/run";
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
    detach: flags.boolean({
      description: "是否直接返回，不显示部署日志",
      default: false,
    }),
    envId: flags.string({ char: "e", description: "环境ID" }),
    serviceName: flags.string({ char: "s", description: "服务名称" }),
    version: flags.string({ char: "v", description: "回退版本" }),
    json: flags.boolean({
      description: "是否以json格式展示结果",
      default: false,
    }),
  };

  async getTaskResult({
    envId,
    serviceName,
    versionName,
    isPrintLog,
  }: {
    envId: string;
    serviceName: string;
    versionName: string;
    isPrintLog: boolean;
  }) {
    return new Promise<void>((resolve) => {
      const timer = setInterval(async () => {
        const { Task: manageTask } = await DescribeServerManageTask({
          EnvId: envId,
          ServerName: serviceName,
        });
        if (isPrintLog) {
          const {
            VersionItems: [versionItem],
          } = await DescribeCloudBaseRunServer({
            EnvId: envId,
            ServerName: serviceName,
            VersionName: versionName,
            Offset: 0,
            Limit: 1,
          });
          const taskLog = await computedTaskLog(envId, manageTask);
          const buildLog = await computedBuildLog(envId, versionItem);
          this.log(`${taskLog}\n${buildLog}`);
        }
        if (manageTask?.Status === "finished") {
          clearInterval(timer);
          resolve();
        }
      }, 3000);
    });
  }

  async getRollbackVersions(envId, serviceName) {
    return await execWithLoading(
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
          rollbackVersions: versionList,
          currentVersion,
        };
      },
      {
        startTip: "获取版本列表中...",
        failTip: "获取版本列表失败，请重试！",
      }
    );
  }
  async run() {
    const { flags } = this.parse(RunRollbackCommand);
    const envId = flags.envId || (await chooseEnvId());
    const serviceName = flags.serviceName || (await chooseServiceId(envId));
    const { rollbackVersions, currentVersion } = await this.getRollbackVersions(
      envId,
      serviceName
    );
    const versionName =
      flags.version ||
      (await chooseVersionName({ versionList: rollbackVersions }));
    if (
      flags.noConfirm ||
      (await cli.confirm(
        `确定从当前版本${currentVersion.VersionName}回退到${versionName}版本吗？(请输入yes或no)`
      ))
    ) {
      await execWithLoading(
        async () => {
          await SubmitServerRollback({
            EnvId: envId,
            ServerName: serviceName,
            CurrentVersionName: currentVersion.VersionName,
            RollbackVersionName: versionName,
          });
          await this.getTaskResult({
            envId,
            serviceName,
            versionName,
            isPrintLog: !flags.detach,
          });
        },
        {
          startTip: flags.detach ? "版本回退中，预计需要3分钟..." : "",
          successTip: "版本回退成功",
          failTip: "版本回退失败，请重试！",
        }
      );
      if (flags.json) {
        this.log(JSON.stringify({ code: 0, errmsg: "success", data: null }));
      }
    } else {
      this.log("取消回退");
    }
  }
}
