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

## service:config

更新服务配置（CLI >2.0.9）

### 基本用法

```bash:no-line-numbers
wxcloud service:config
```

### 命令行参数

```bash:no-line-numbers
ARGUMENTS
  ACTION  [default: read] 操作模式，默认为 read，更新配置 update

OPTIONS
  -c, --cpu=cpu                                 CPU
  -e, --envId=envId                             环境ID
  -h, --help                                    查看帮助
  -l, --customLog=customLog                     自定义日志采集路径
  -m, --mem=mem                                 内存
  -n, --minNum=minNum                           最小实例数
  -p, --envParams=envParams                     环境变量，格式aa=bb&cc=dd
  -s, --serviceName=serviceName                 服务名称
  -x, --maxNum=maxNum                           最大实例数
  --cpuThreshold=cpuThreshold                   CPU 使用率调度策略阈值
  --memThreshold=memThreshold                   内存使用率调度策略阈值
  --noConfirm                                   更新配置时跳过二次确认
  --region=ap-shanghai|ap-guangzhou|ap-beijing  [default: ap-shanghai] 地域
```

### 实际举例

将服务的调度策略更新为：CPU >= 60%，内存 >= 60%

```bash:no-line-numbers
wxcloud service:config update --cpuThreshold=60 --memThreshold=60
```

## service:remove

删除服务

### 基本用法

```bash:no-line-numbers
wxcloud service:remove
```

### 命令行参数

```bash:no-line-numbers
OPTIONS
  -e, --envId=envId                             环境ID
  -h, --help                                    查看帮助
  -s, --serviceName=serviceName                 服务名称
  --noConfirm                                   跳过删除确认
  --region=ap-shanghai|ap-guangzhou|ap-beijing  [default: ap-shanghai] 地域
```
