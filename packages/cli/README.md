# @wxcloud/cli

微信云服务 CLI 工具

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

## 安装

```
npm install -g @wxcloud/cli
```

## 使用方法

### 登录

```
wxcloud login --appId <微信AppId> --privateKey <秘钥>
```

### 登出

```
wxcloud logout
```

### 查看环境列表

```
wxcloud env:list
```

### 查看服务列表

```
wxcloud service:list --envId=<环境ID>
```

### 查看版本列表

```
wxcloud version:list --envId=<环境ID> -serviceName=<服务名>
```

### 发布

```
wxcloud run:deploy [目标目录]
```

可选参数
```
OPTIONS
  -e, --envId=envId              环境ID
  -h, --help                     查看帮助信息
  -s, --serviceName=serviceName  服务名
  --containerPort=containerPort  监听端口
  --dockerfile=dockerfile        Dockerfile文件名
  --noConfirm                    发布前是否跳过二次确认
  --override                     缺省的参数是否沿用旧版本配置
  --targetDir=targetDir          目标目录
```

### 云存储上传文件

```
wxcloud storage:upload <文件目录>
```

可选参数
```
OPTIONS
  -c, --concurrency=concurrency       并发上传数量
  -e, --envId=envId                   环境ID
  -h, --help                          查看帮助信息
  -m, --mode=(staticstorage|storage)  上传模式
  -r, --remotePath=remotePath         目标目录
```

### 上传云函数（仅云开发环境可用）

```
wxcloud function:upload <云函数代码目录>
```

可选参数
```
OPTIONS
  -e, --envId=envId   环境ID
  -h, --help          查看帮助信息
  -n, --name=name     函数名
  --remoteNpmInstall  是否云端安装依赖
```
