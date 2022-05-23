# run

使用 `wxcloud run` 命令，可以进行云托管服务部署相关的操作。

## run:deploy

部署云托管服务

### 基本用法
```bash:no-line-numbers
wxcloud run:deploy [PATH]
```

### 命令行参数

```bash:no-line-numbers
OPTIONS
  -e, --envId=envId              环境ID
  -h, --help                     查看帮助信息
  -s, --serviceName=serviceName  服务名
  --containerPort=containerPort  监听端口
  --detach                       是否直接返回，不显示部署日志
  --dockerfile=dockerfile        Dockerfile文件名

  --envParams=envParams          服务环境变量，在此版本开始生效，同步到服务设置，格式为xx=a&yy=
                                 b，默认为空
  --libraryImage=libraryImage    线上镜像仓库的tag
  --noConfirm                    发布前是否跳过二次确认
  --override                     缺省的参数是否沿用旧版本配置
  --releaseType=FULL|GRAY        发布类型：FULL-全量发布；GRAY-灰度发布；
  --remark=remark                版本备注
  --targetDir=targetDir          目标目录
```

## run:rollback

回退云托管服务版本

### 基本用法
```bash:no-line-numbers
wxcloud run:rollback
```

### 命令行参数

```bash:no-line-numbers

OPTIONS
  -e, --envId=envId              环境ID
  -h, --help                     查看帮助
  -s, --serviceName=serviceName  服务名称
  -v, --version=version          回退版本
  --detach                       是否直接返回，不显示部署日志
  --json                         是否以json格式展示结果
  --noConfirm                    发布前是否跳过二次确认


```
