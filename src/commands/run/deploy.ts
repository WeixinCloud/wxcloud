import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import {
  DescribeCloudBaseBuildService,
  DescribeCloudBaseRunServerVersion,
  DescribeCloudBaseRunServer,
  SubmitServerRelease,
  DescribeServiceBaseConfig,
  UpdateServerBaseConfig,
  DescribeServerManageTask,
} from "../../api";
import {
  chooseEnvId,
  chooseServiceId,
  printVerticalTable,
} from "../../utils/ux";
import { uploadVersionPackage } from "../../api/files";
import * as fs from "fs";
import * as path from "path";
import { readLoginState } from "../../utils/auth";
import * as inquirer from "inquirer";
import { zipDir } from "../../utils/zip";
import { execWithLoading } from "../../utils/loading";
import { computedBuildLog, computedTaskLog } from "../../utils/run";
export default class RunDeployCommand extends Command {
  static description = "创建版本";

  static examples = [`wxcloud run:deploy <项目根目录>`];
  static args = [{ name: "path", description: "项目根目录", default: "." }];
  static flags = {
    help: flags.help({ char: "h", description: "查看帮助信息" }),
    envId: flags.string({ char: "e", description: "环境ID" }),
    serviceName: flags.string({ char: "s", description: "服务名" }),
    override: flags.boolean({
      description: "缺省的参数是否沿用旧版本配置",
      default: false,
    }),
    noConfirm: flags.boolean({
      description: "发布前是否跳过二次确认",
      default: false,
    }),
    targetDir: flags.string({ description: "目标目录" }),
    containerPort: flags.integer({ description: "监听端口" }),
    dockerfile: flags.string({ description: "Dockerfile文件名" }),
    detach: flags.boolean({
      description: "是否直接返回，不显示部署日志",
      default: false,
    }),
    envParams: flags.string({
      description:
        "服务环境变量，在此版本开始生效，同步到服务设置，格式为xx=a&yy=b，默认为空",
    }),
    strategy: flags.string({
      description: "发布策略；FULL-全量；GRAY-灰度；",
      options: ["FULL", "GRAY"],
    }),
    remark: flags.string({
      description: "版本备注",
    }),
  };

  async getTaskResult({
    envId,
    serviceName,
    isPrintLog,
  }: {
    envId: string;
    serviceName: string;
    isPrintLog: boolean;
  }) {
    return new Promise<void>((resolve) => {
      const timer = setInterval(async () => {
        const { Task: manageTask } = await DescribeServerManageTask({
          EnvId: envId,
          ServerName: serviceName,
        });
        if (isPrintLog && manageTask?.VersionName) {
          const {
            VersionItems: [versionItem],
          } = await DescribeCloudBaseRunServer({
            EnvId: envId,
            ServerName: serviceName,
            VersionName: manageTask?.VersionName,
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
  async run() {
    const { args, flags } = this.parse(RunDeployCommand);
    const { override } = flags;
    const envId = flags.envId || (await chooseEnvId());
    const serviceName = flags.serviceName || (await chooseServiceId(envId));
    const buildInfo = await DescribeCloudBaseBuildService({
      EnvId: envId,
      ServiceName: serviceName,
    });

    const latestVersionInfo = await execWithLoading(async () => {
      const { VersionItems } = await DescribeCloudBaseRunServer({
        EnvId: envId,
        ServerName: serviceName,
        Offset: 0,
        Limit: 10,
      });
      return await DescribeCloudBaseRunServerVersion({
        EnvId: envId,
        ServerName: serviceName,
        VersionName: VersionItems?.[0]?.VersionName,
      });
    });

    const newReleaseConfig = {
      ServerName: serviceName,
      EnvId: envId,
      DeployType: "package",
      ReleaseType: (
        await inquirer.prompt([
          {
            name: "releaseType",
            message: "请选择发布类型",
            type: "list",
            choices: [
              { name: "全量发布", value: "FULL" },
              { name: "灰度发布", value: "GRAY" },
            ],
          },
        ])
      ).releaseType,
      HasDockerfile: true,
      WxAppId: (await readLoginState()).appid,
      PackageName: buildInfo.PackageName,
      PackageVersion: buildInfo.PackageVersion,
      BuildDir:
        flags.targetDir ||
        (override
          ? latestVersionInfo.BuildDir
          : await cli.prompt('请输入工作目录（不填默认为根目录"."）', {
              required: false,
              default: ".",
            })),
      Dockerfile:
        flags.dockerfile ||
        (override
          ? latestVersionInfo.DockerfilePath
          : await cli.prompt("请输入Dockerfile文件名（不填默认为Dockerfile）", {
              required: false,
              default: "Dockerfile",
            })),
      Port:
        flags.containerPort ||
        (override
          ? latestVersionInfo.ContainerPort
          : parseInt(
              await cli.prompt("请输入端口号（不填默认为80）", {
                required: false,
                default: "80",
              })
            )),
      VersionRemark:
        flags.remark ||
        (await cli.prompt("请输入版本备注", { required: false })),
    };

    console.log("\n以下为本次发布的信息：");
    console.log("========================================");
    printVerticalTable(
      [
        { 微信AppId: newReleaseConfig.WxAppId },
        { 环境ID: newReleaseConfig.EnvId },
        { 服务名称: newReleaseConfig.ServerName },
        { Dockerfile文件名: newReleaseConfig.Dockerfile },
        { 目标目录: newReleaseConfig.BuildDir },
        { 端口号: newReleaseConfig.Port },
        {
          发布模式:
            newReleaseConfig.ReleaseType === "FULL" ? "全量发布" : "灰度发布",
        },
        flags.envParams && {
          服务参数: flags.envParams,
        },
        { 版本备注: newReleaseConfig.VersionRemark || "-" },
      ].filter(Boolean)
    );
    console.log("========================================");
    if (flags.noConfirm || (await cli.confirm("确定发布？(请输入yes或no)"))) {
      const zipFile = `.cloudrun_${serviceName}_${Date.now()}.zip`;
      const srcPath = path.resolve(process.cwd(), args.path);
      const destPath = path.resolve(process.cwd(), zipFile);
      await zipDir(srcPath, destPath);
      try {
        if (flags.envParams) {
          await execWithLoading(
            async () => {
              const { ServiceBaseConfig: lastConfig } =
                await DescribeServiceBaseConfig({
                  EnvId: envId,
                  ServerName: serviceName,
                });
              await UpdateServerBaseConfig({
                EnvId: envId,
                ServerName: serviceName,
                Conf: {
                  ...lastConfig,
                  EnvParams: JSON.stringify(
                    flags.envParams.split("&").reduce((prev, cur) => {
                      prev[cur.split("=")[0]] = cur.split("=")[1];
                      return prev;
                    }, {})
                  ),
                },
              });
            },
            {
              startTip: "服务参数更新中...",
              failTip: "服务参数更新失败",
            }
          );
        }

        await execWithLoading(
          async () => {
            await uploadVersionPackage(
              buildInfo.UploadUrl,
              fs.readFileSync(zipFile)
            );
          },
          {
            startTip: "代码包上传中...",
            failTip: "代码包上传失败",
          }
        );
        await execWithLoading(
          async () => {
            await SubmitServerRelease(newReleaseConfig);
            await this.getTaskResult({
              envId,
              serviceName,
              isPrintLog: !flags.detach,
            });
          },
          {
            startTip: flags.detach ? "部署中..." : "",
            successTip: "部署完成，请前往控制台查看详情。",
            failTip: "部署失败",
          }
        );
        cli.url(
          "点击前往控制台",
          `https://cloud.weixin.qq.com/cloudrun/service/${newReleaseConfig.ServerName}`
        );
      } finally {
        await fs.promises.unlink(destPath);
      }
    } else {
      console.log("取消发布");
    }
  }
}
