import { Command, flags } from "@oclif/command";
import { cli } from "cli-ux";
import { callCloudApi } from "../../api/cloudapi";
import {
  DescribeCloudBaseBuildService,
  DescribeCloudBaseRunServerVersion,
  DescribeCloudBaseRunServer,
  SubmitServerRelease,
} from "../../api";
import { chooseEnvId, chooseServiceId } from "../../utils/ux";
import { uploadVersionPackage } from "../../api/files";
import * as fs from "fs";
import * as path from "path";
import { readLoginState } from "../../utils/auth";
import * as inquirer from "inquirer";
import { zipDir } from "../../utils/zip";

export default class RunDeployCommand extends Command {
  static description = "创建版本";

  static examples = [`wxcloud version:create <项目根目录>`];
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
    verbose: flags.boolean({
      description: "是否显示构建和部署步骤日志，不直接返回",
      default: false,
    }),
    envParams: flags.string({
      description: "服务参数，在此版本开始生效，同步到服务设置",
    }),
    strategy: flags.string({
      description: "发布策略；FULL-全量；GRAY-灰度；",
    }),
    remark: flags.string({
      description: "版本备注",
    }),
    localBuild: flags.string({
      description: "是否在本地构建(本地代码构建方式，无docker环境提示失败)",
    }),
    image: flags.string({
      char: "i",
      description: "镜像标签或ID(上传镜像方式)",
    }),
  };

  async run() {
    const { args, flags } = this.parse(RunDeployCommand);
    const { override } = flags;
    const envId = flags.envId || (await chooseEnvId());
    const serviceName = flags.serviceName || (await chooseServiceId(envId));
    const buildInfo = await DescribeCloudBaseBuildService({
      EnvId: envId,
      ServiceName: serviceName,
    });

    const latestVersion = (
      await DescribeCloudBaseRunServer({
        EnvId: envId,
        ServerName: serviceName,
        Offset: 0,
        Limit: 10,
      })
    ).VersionItems[0];
    const latestVersionInfo = await DescribeCloudBaseRunServerVersion({
      EnvId: envId,
      ServerName: serviceName,
      VersionName: latestVersion.VersionName,
    });

    const newReleaseConfig = {
      ServerName: serviceName,
      EnvId: envId,
      DeployType: "package",
      ReleaseType: "FULL",
      HasDockerfile: true,
      WxAppId: (await readLoginState()).appid,
      PackageName: buildInfo.PackageName,
      PackageVersion: buildInfo.PackageVersion,
      BuildDir:
        flags.targetDir ||
        (override
          ? latestVersionInfo.BuildDir
          : await cli.prompt('请输入工作目录（如果为根目录请填入"."）')),
      Dockerfile:
        flags.dockerfile ||
        (override
          ? latestVersionInfo.DockerfilePath
          : await cli.prompt("请输入Dockerfile文件名")),
      Port:
        flags.containerPort ||
        (override
          ? latestVersionInfo.ContainerPort
          : parseInt(await cli.prompt("请输入端口号"))),
    };

    console.log("\n以下为本次发布的信息：");
    console.log("==========");
    console.log("微信AppId：", newReleaseConfig.WxAppId);
    console.log("环境ID：", newReleaseConfig.EnvId);
    console.log("服务名：", newReleaseConfig.ServerName);
    console.log("Dockerfile文件名：", newReleaseConfig.Dockerfile);
    console.log("目标目录：", newReleaseConfig.BuildDir);
    console.log("端口号：", newReleaseConfig.Port);
    console.log("发布模式：全量发布 (构建成功后会自动上线)");
    console.log("==========");

    if (flags.noConfirm || (await cli.confirm("确定发布？(请输入yes或no)"))) {
      const zipFile = `.cloudrun_${serviceName}_${Date.now()}.zip`;
      const srcPath = path.resolve(process.cwd(), args.path);
      const destPath = path.resolve(process.cwd(), zipFile);
      await zipDir(srcPath, destPath);
      try {
        await uploadVersionPackage(
          buildInfo.UploadUrl,
          fs.readFileSync(zipFile)
        );
        const createResult = await SubmitServerRelease(newReleaseConfig);
        console.log("触发部署成功，请前往控制台查看详情。");
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
