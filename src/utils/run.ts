import { padEnd } from "lodash";
import moment from "moment";
import {
  DescribeCloudBaseRunBuildLog,
  DescribeCloudBaseRunProcessLog,
  SearchClsLog,
} from "../api";
import { VersionItems, IServerManageTaskInfo } from "../api/interface";
import { STAGE_TEXT, STATUS_TEXT, STAGE_COST } from "../constants";
import { readLoginState } from "./auth";

export async function computedBuildLog(envId: string, version: VersionItems) {
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
    runId
      ? DescribeCloudBaseRunProcessLog({
          EnvId: envId,
          RunId: runId,
        })
      : Promise.resolve(null),
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
export async function computedTaskLog(
  envId: string,
  task: IServerManageTaskInfo
) {
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
