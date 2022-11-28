import { CloudAPI } from '@wxcloud/core';
import { padEnd } from 'lodash';
import moment from 'moment';
import { DescribeCloudBaseRunBuildLog, DescribeCloudBaseRunProcessLog, SearchClsLog } from '../api';
import { VersionItems, IServerManageTaskInfo } from '../api/interface';
import { STAGE_TEXT, STATUS_TEXT, STAGE_COST } from '../constants';
import { readLoginState } from './auth';
function ansiRegex({ onlyFirst = false } = {}) {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'
  ].join('|');

  return new RegExp(pattern, onlyFirst ? undefined : 'g');
}
function stripAnsi(string) {
  if (typeof string !== 'string') {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }

  return string.replace(ansiRegex(), '');
}
function buildVersionSearchQuery(server?: string, version?: string) {
  if (server) {
    return version
      ? `(container_name:${version} OR __TAG__.container_name:${version})`
      : `(container_name:/${server}-[0-9]+/ OR __TAG__.container_name:/${server}-[0-9]+/)`;
  }
  return '';
}

export async function computedBuildLog(
  envId: string,
  version?: CloudAPI.IAPITCBCloudBaseRunServerVersionItem
) {
  const buildId = version?.buildId;
  const runId = version?.runId;
  const [runBuildLog, cbrLog, userLog] = await Promise.all([
    buildId
      ? DescribeCloudBaseRunBuildLog({
          EnvId: envId,
          ServiceVersion: version?.versionName,
          BuildId: buildId
        })
      : Promise.resolve(null),
    runId
      ? DescribeCloudBaseRunProcessLog({
          EnvId: envId,
          RunId: runId
        })
      : Promise.resolve(null),
    SearchClsLog({
      EnvId: envId,
      StartTime: moment().subtract(10, 'm').format('YYYY-MM-DD HH:mm:ss'),
      EndTime: moment().add(10, 'm').format('YYYY-MM-DD HH:mm:ss'),
      QueryString: buildVersionSearchQuery(version?.versionName, version?.versionName),
      Limit: 100
    })
      .then(({ LogResults = {} }) =>
        LogResults?.Results?.sort((a, b) => {
          if (a.timestamp === b.timestamp) {
            return 0;
          }
          return -1;
        })
          .map(r => {
            try {
              const maybeJSON = JSON.parse(r.content);
              return maybeJSON.log || '';
            } catch (error) {
              return r.content;
            }
          })
          .join('\n')
      )
      .catch(() => '')
  ]);
  const pipelineHtml = runBuildLog?.Log?.Text?.trim() || '';
  const cbrHtml = cbrLog?.Logs?.join('\n') || '';
  const userHtml = userLog?.trim() || '';

  return [pipelineHtml, cbrHtml, userHtml].map(stripAnsi).filter(Boolean).join('<br/>***<br/>');
}
export async function computedTaskLog(envId: string, task: CloudAPI.IAPITCBServerManageTaskInfo) {
  const { appid } = await readLoginState();
  const stepsToConsider = task?.steps?.filter(({ status }) => status !== 'notInvolve') ?? [];
  const taskDisplayInfo = task?.steps
    ? `部署开始于 ${task.createTime}\n\nAppID: ${appid}\n环境名称：${envId}\n
      ${stepsToConsider
        .filter(({ status }) => status !== 'todo')
        .map(({ name, status, failReason, costTime }, i) => {
          return [
            `[${i + 1}/${stepsToConsider?.length}]`,
            padEnd(STAGE_TEXT[name] || name, 8, '　'),
            padEnd(STATUS_TEXT[status] || status, 3, '　'),
            status === 'running' ? `预计需要 ${STAGE_COST[name]}...` : `${costTime}s`,
            failReason
          ]
            .filter(v => v)
            .join(' ');
        })
        .join('\n')}`
    : '';
  return taskDisplayInfo;
}
