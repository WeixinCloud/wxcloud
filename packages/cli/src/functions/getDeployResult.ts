import { DescribeServerManageTask, DescribeCloudBaseRunServer } from '../api';
import { computedTaskLog, computedBuildLog } from '../utils/run';
import logUpdate from 'log-update';
import { CloudAPI } from '@wxcloud/core';
export async function getDeployResult({
  envId,
  serviceName,
  isPrintLog,
  log
}: {
  envId: string;
  serviceName: string;
  isPrintLog: boolean;
  log: (...args: string[]) => void;
}) {
  return new Promise<void>(resolve => {
    const timer = setInterval(async () => {
      const { task: manageTask } = await CloudAPI.tcbDescribeServerManageTask({
        envId,
        serverName: serviceName
      });
      if (isPrintLog && manageTask?.versionName) {
        const { versionItems } = await CloudAPI.tcbDescribeCloudBaseRunServer({
          envId: envId,
          serverName: serviceName,
          versionName: manageTask?.versionName,
          offset: 0,
          limit: 1
        });
        const taskLog = await computedTaskLog(envId, manageTask);
        const buildLog = await computedBuildLog(envId, versionItems?.[0]);
        logUpdate(`${taskLog}\n${buildLog}\n`);
        if (manageTask?.status === 'finished') {
          clearInterval(timer);
          resolve();
        }
      } else {
        clearInterval(timer);
        resolve();
      }
    }, 3000);
  });
}
