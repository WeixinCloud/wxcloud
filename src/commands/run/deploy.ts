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
  DescribeCloudBaseRunImages,
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
    libraryImage: flags.string({ description: "线上镜像仓库的tag" }),
    detach: flags.boolean({
      description: "是否直接返回，不显示部署日志",
      default: false,
    }),
    envParams: flags.string({
      description:
        "服务环境变量，在此版本开始生效，同步到服务设置，格式为xx=a&yy=b，默认为空",
    }),
    releaseType: flags.string({
      description: "发布类型：FULL-全量发布；GRAY-灰度发布；",
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
          if (manageTask?.Status === "finished") {
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

  async getReleaseConfig(): Promise<Parameters<typeof SubmitServerRelease>[0]> {
    const { flags } = this.parse(RunDeployCommand);
    const envId = flags.envId || (await chooseEnvId());
    const serviceName = flags.serviceName || (await chooseServiceId(envId));
    const buildInfo = await DescribeCloudBaseBuildService({
      EnvId: envId,
      ServiceName: serviceName,
    });
    const latestVersionInfo = flags.override
      ? await execWithLoading(async () => {
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
        })
      : await Promise.resolve(null);

    let newReleaseConfig: any = {
      ServerName: serviceName,
      EnvId: envId,
      DeployType: flags.libraryImage
        ? "image"
        : flags.targetDir
        ? "package"
        : (
            await inquirer.prompt([
              {
                name: "deployType",
                message: "请选择部署方式",
                type: "list",
                choices: [
                  { name: "手动上传代码包", value: "package" },
                  { name: "镜像拉取", value: "image" },
                ],
              },
            ])
          ).deployType,
      ReleaseType: flags.noConfirm
        ? "FULL"
        : flags.releaseType ??
          (
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
    };

    if (newReleaseConfig.DeployType === "package") {
      newReleaseConfig.PackageName = buildInfo.PackageName;
      newReleaseConfig.PackageVersion = buildInfo.PackageVersion;
      newReleaseConfig.BuildDir =
        flags.targetDir ||
        (flags.override
          ? latestVersionInfo!.BuildDir
          : await cli.prompt('请输入工作目录（不填默认为根目录"."）', {
              required: false,
              default: ".",
            }));
      newReleaseConfig.Dockerfile =
        flags.dockerfile ||
        (flags.override
          ? latestVersionInfo!.DockerfilePath
          : await cli.prompt("请输入Dockerfile文件名（不填默认为Dockerfile）", {
              required: false,
              default: "Dockerfile",
            }));
    } else {
      const Images = await execWithLoading(async () => {
        const { Images } = await DescribeCloudBaseRunImages({
          EnvId: envId,
          ServiceName: serviceName,
        });
        return Images;
      });
      if (flags.libraryImage) {
        const imageInfo = Images.find(({ Tag }) => Tag === flags.libraryImage);
        if (!imageInfo) {
          this.error("镜像不存在");
        }
        newReleaseConfig.ImageUrl = imageInfo.ImageUrl;
      } else {
        newReleaseConfig.ImageUrl = (
          await inquirer.prompt([
            {
              name: "imageUrl",
              message: "请选择镜像",
              type: "list",
              choices: Images.map(({ Tag, ImageUrl }) => ({
                name: Tag,
                value: ImageUrl,
              })),
            },
          ])
        ).imageUrl;
      }
    }

    newReleaseConfig.Port =
      flags.containerPort ||
      (flags.override
        ? latestVersionInfo!.ContainerPort
        : parseInt(
            await cli.prompt("请输入端口号（不填默认为80）", {
              required: false,
              default: "80",
            })
          ));
    newReleaseConfig.VersionRemark =
      flags.remark || (await cli.prompt("请输入版本备注", { required: false }));

    console.log("\n以下为本次发布的信息：");
    console.log("========================================");
    printVerticalTable(
      [
        { 微信AppId: newReleaseConfig.WxAppId },
        { 环境ID: newReleaseConfig.EnvId },
        { 服务名称: newReleaseConfig.ServerName },
        {
          部署方式:
            newReleaseConfig.DeployType === "package"
              ? "手动上传代码包"
              : "镜像拉取",
        },
        {
          发布模式:
            newReleaseConfig.ReleaseType === "FULL" ? "全量发布" : "灰度发布",
        },
        ...(newReleaseConfig.DeployType === "package"
          ? [
              { Dockerfile文件名: newReleaseConfig.Dockerfile },
              { 目标目录: newReleaseConfig.BuildDir },
            ]
          : [{ 镜像地址: newReleaseConfig.ImageUrl }]),
        { 端口号: newReleaseConfig.Port },
        flags.envParams && {
          服务参数: flags.envParams,
        },
        { 版本备注: newReleaseConfig.VersionRemark || "-" },
      ].filter((x): x is any => Boolean(x))
    );
    console.log("========================================");
    return newReleaseConfig;
  }

  async updateEnvParams(EnvId, ServerName, envParams) {
    await execWithLoading(
      async () => {
        const { ServiceBaseConfig: lastConfig } =
          await DescribeServiceBaseConfig({
            EnvId,
            ServerName,
          });
        await UpdateServerBaseConfig({
          EnvId,
          ServerName,
          Conf: {
            ...lastConfig,
            EnvParams: JSON.stringify(
              envParams.split("&").reduce((prev, cur) => {
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
  async packageDeploy(releaseConfig) {
    const { args } = this.parse(RunDeployCommand);
    const { ServerName, EnvId } = releaseConfig;
    const zipFile = `.cloudrun_${ServerName}_${Date.now()}.zip`;
    const srcPath = path.resolve(process.cwd(), args.path);
    const destPath = path.resolve(process.cwd(), zipFile);
    await zipDir(srcPath, destPath);
    try {
      return await execWithLoading(
        async () => {
          const { UploadUrl, PackageName, PackageVersion } =
            await DescribeCloudBaseBuildService({
              EnvId,
              ServiceName: ServerName,
            });
          await uploadVersionPackage(UploadUrl, fs.readFileSync(zipFile));
          return { PackageName, PackageVersion };
        },
        {
          startTip: "代码包上传中...",
          failTip: "代码包上传失败",
        }
      );
    } finally {
      await fs.promises.unlink(destPath);
    }
  }
  async run() {
    const { flags } = this.parse(RunDeployCommand);
    let newReleaseConfig = await this.getReleaseConfig();
    const { ServerName, EnvId, DeployType } = newReleaseConfig;
    if (flags.noConfirm || (await cli.confirm("确定发布？(请输入yes或no)"))) {
      if (flags.envParams) {
        await this.updateEnvParams(EnvId, ServerName, flags.envParams);
      }
      if (DeployType === "package") {
        const { PackageName, PackageVersion } = await this.packageDeploy(
          newReleaseConfig
        );
        newReleaseConfig.PackageName = PackageName;
        newReleaseConfig.PackageVersion = PackageVersion;
      }
      await execWithLoading(
        async () => {
          await SubmitServerRelease(newReleaseConfig);
          await this.getTaskResult({
            envId: EnvId,
            serviceName: ServerName,
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
    } else {
      console.log("取消发布");
    }
  }
}
