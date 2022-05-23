# service

通过 `wxcloud service`，可以进行云托管服务相关操作。

## service:list

查看服务列表

### 基本用法

```bash:no-line-numbers
wxcloud service:list
```

### 命令行参数

```bash:no-line-numbers
OPTIONS
  -e, --envId=envId              环境ID
  -h, --help                     查看帮助
  -p, --page=page
  -s, --serviceName=serviceName  服务名称
  --json                         是否以json格式展示结果

```

## service:create

创建新服务

### 基本用法

```bash:no-line-numbers
wxcloud service:create
```

### 命令行参数

```bash:no-line-numbers

OPTIONS
  -e, --envId=envId              环境ID
  -h, --help                     查看帮助
  -s, --serviceName=serviceName  服务名称
  --isPublic                     是否开通外网访问
  --json                         是否以json格式展示结果

```