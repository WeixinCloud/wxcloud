import { DescribeCloudBaseRunServers, DescribeWxCloudBaseRunEnvs } from "../api";
import * as inquirer from "inquirer";

export async function chooseEnvId() {
  const res = await DescribeWxCloudBaseRunEnvs();
  if (res.EnvList.length === 0) {
    throw new Error("您尚未创建任何环境，请先创建环境。");
  }
  const choices = res.EnvList.map((env) => {
    return {
      name: `${env.Alias} (${env.EnvId})`,
      value: env.EnvId,
    };
  });
  let responses: any = await inquirer.prompt([
    {
      name: "envId",
      message: "选择环境",
      type: "list",
      choices,
    },
  ]);
  return responses.envId;
}

export async function chooseServiceId(envId: string) {
  const res = await DescribeCloudBaseRunServers({
      EnvId: envId,
      Offset: 0,
      Limit: 30
  });
  if (res.CloudBaseRunServerSet.length === 0) {
    throw new Error("您尚未创建任何服务，请先创建服务。");
  }
  const choices = res.CloudBaseRunServerSet.map((service) => {
    return {
      name: service.ServerName,
    };
  });
  let responses: any = await inquirer.prompt([
    {
      name: "serviceName",
      message: "选择服务",
      type: "list",
      choices,
    },
  ]);
  return responses.serviceName;
}
