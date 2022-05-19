# deploy

`wxcloud deploy` 能够对服务进行一次部署发布。

## 基本用法

输入以下命令即可开始交互式部署，在此过程中 CLI 会自动询问您需要发布的服务、环境等信息。

```bash:no-line-numbers
wxcloud deploy
```

## 进阶用法

手动指定相关参数来部署：

```bash:no-line-numbers
wxcloud deploy -e <环境 ID> -s <服务名称>
```

## 命令行参数

支持的命令行参数如下：

```text:no-line-numbers
OPTIONS
  -e, --envId=envId              环境ID
  -p, --port=port                [default: 3000] 端口号
  -s, --serviceName=serviceName  服务名
  --dryRun                       不执行实际部署指令
```