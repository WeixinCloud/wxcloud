import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import { padEnd } from "lodash";
import moment from "moment";
import {
  DescribeCloudBaseRunBuildLog,
  DescribeCloudBaseRunProcessLog,
  DescribeCloudBaseRunServer,
  DescribeServerManageTask,
  SearchClsLog,
  SubmitServerRollback,
} from "../../api/cloudapi";
import { IServerManageTaskInfo, VersionItems } from "../../api/interface";
import { STAGE_COST, STAGE_TEXT, STATUS_TEXT } from "../../constants";
import { readLoginState } from "../../utils/auth";
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
    detach: flags.boolean({
      description: "是否直接返回，不显示部署日志",
      default: false,
    }),
    envId: flags.string({ char: "e", description: "环境ID" }),
    serviceName: flags.string({ char: "s", description: "服务名称" }),
    version: flags.string({ char: "v", description: "回退版本" }),
  };

  async computedBuildLog(envId: string, version: VersionItems) {
    const buildId = version?.BuildId;
    const runId = version?.RunId;
    const [runBuildLog, cbrLog, userLog] = await Promise.all([
      buildId
        ? DescribeCloudBaseRunBuildLog({
            EnvId: envId,
            ServiceVersion: version?.VersionName,
            BuildId: buildId,
          })
        : Promise.resolve(null),
      DescribeCloudBaseRunProcessLog({
        EnvId: envId,
        RunId: runId,
      }),
      SearchClsLog({
        EnvId: envId,
        StartTime: moment().subtract(10, "m").format("YYYY-MM-DD HH:mm:ss"),
        EndTime: moment().add(10, "m").format("YYYY-MM-DD HH:mm:ss"),
        QueryString: `tcb_type:CloudBaseRun AND container_name:${version?.VersionName}`,
        Limit: 100,
      }).then(({ LogResults = {} }) =>
        LogResults?.Results?.sort((a, b) => {
          if (a.timestamp === b.timestamp) {
            return 0;
          }
          return -1;
        })
          .map((r) => {
            try {
              const maybeJSON = JSON.parse(r.content);
              return maybeJSON.log || "";
            } catch (error) {
              return r.content;
            }
          })
          .join("\n")
      ),
    ]);
    const pipelineHtml = runBuildLog?.Log?.Text?.trim() || "";
    const cbrHtml = cbrLog?.Logs?.join("\n") || "";
    const userHtml = userLog?.trim() || "";

    return [pipelineHtml, cbrHtml, userHtml]
      .filter(Boolean)
      .join("<br/>***<br/>");
  }
  async computedTaskLog(envId: string, task: IServerManageTaskInfo) {
    const { appid } = await readLoginState();
    const stepsToConsider =
      task?.Steps?.filter(({ Status }) => Status !== "notInvolve") ?? [];
    const taskDisplayInfo = task?.Steps
      ? `部署开始于 ${task.CreateTime}\n\nAppID: ${appid}\n环境名称：${envId}\n
        ${stepsToConsider
          .filter(({ Status }) => Status !== "todo")
          .map(({ Name, Status, FailReason, CostTime }, i) => {
            return [
              `[${i + 1}/${stepsToConsider?.length}]`,
              padEnd(STAGE_TEXT[Name] || Name, 8, "　"),
              padEnd(STATUS_TEXT[Status] || Status, 3, "　"),
              Status === "running"
                ? `预计需要 ${STAGE_COST[Name]}...`
                : `${CostTime}s`,
              FailReason,
            ]
              .filter((v) => v)
              .join(" ");
          })
          .join("\n")}`
      : "";
    return taskDisplayInfo;
  }
  /**
   * 获取任务执行结果
   * @param envId 环境id
   * @param serviceName 服务名称
   * @param versionName 版本名称
   * @param isPrintLog 是否需要打印日志
   * @returns
   */
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
          const taskLog = await this.computedTaskLog(envId, manageTask);
          const buildLog = await this.computedBuildLog(envId, versionItem);
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
    } else {
      this.log("取消回退");
    }
  }
}
