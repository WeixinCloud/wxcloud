# 框架识别

当你从旧项目迁移到云托管时，@wxcloud/cli 可以自动检测你正在使用的框架和语言，并提供可用的 `Dockerfile` 和默认配置文件。

```bash:no-line-numbers
$ wxcloud migrate

Wxcloud CLI 2.0.1-beta.15
✔ 分析项目文件
✔ 构建容器化文件
✔ 写入相关文件

› 信息 即将使用 Node npm 构造器（含 build 阶段）
› 信息 没有在 package.json 中找到 Node 版本约束，将使用推荐版本的 Node 镜像
› 信息 将使用镜像 lts-alpine (16.15.0-alpine)
› 警告 收集到 0 条环境变量
› 信息 写入 /path/to/project/.dockerignore
› 信息 写入 /path/to/project/Dockerfile



✔ 项目容器化成功，执行 `wxcloud deploy` 立即部署
```

当你使用 `wxcloud migrate` 迁移完成后，你可以使用 `wxcloud deploy` 命令来部署项目。

你可以直接使用生成出来的项目配置文件进行部署，或者根据自行项目需求改写。你也可以使用 `wxcloud migrate` 来重新生成项目配置文件。