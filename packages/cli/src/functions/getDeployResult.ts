import { DescribeServerManageTask, DescribeCloudBaseRunServer } from '../api';
import { computedTaskLog, computedBuildLog } from '../utils/run';
import logUpdate from 'log-update';
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
      const { Task: manageTask } = await DescribeServerManageTask({
        EnvId: envId,
        ServerName: serviceName
      });
      if (isPrintLog && manageTask?.VersionName) {
        const {
          VersionItems: [versionItem]
        } = await DescribeCloudBaseRunServer({
          EnvId: envId,
          ServerName: serviceName,
          VersionName: manageTask?.VersionName,
          Offset: 0,
          Limit: 1
        });
        const taskLog = await computedTaskLog(envId, manageTask);
        const buildLog = await computedBuildLog(envId, versionItem);
        logUpdate(`${taskLog}\n${buildLog}`);
        if (manageTask?.Status === 'finished') {
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
