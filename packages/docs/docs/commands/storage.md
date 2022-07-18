# storage

使用 `wxcloud:storage` 相关命令，可以管理云托管文件存储和静态存储。

## storage:upload

上传文件

### 基本用法
```bash:no-line-numbers
wxcloud storage:upload [PATH]
```

### 命令行参数

```bash:no-line-numbers
OPTIONS
  -c, --concurrency=concurrency       并发上传数量
  -e, --envId=envId                   环境ID
  -h, --help                          查看帮助信息
  -m, --mode=(staticstorage|storage)  上传模式
  -r, --remotePath=remotePath         目标目录

```

### 实际举例

在 wxrun-id 环境下上传本地 /foo/bar/baz 目录下的所有文件到对象存储的根目录下。

```bash:no-line-numbers
wxcloud storage:upload /foo/bar/baz --envId=wxrun-id --mode=storage --remotePath=/
```

## storage:purge

刷新静态存储缓存

### 基本用法
```bash:no-line-numbers
wxcloud storage:purge
```

### 命令行参数

```bash:no-line-numbers
OPTIONS
  -e, --envId=envId                             环境ID
  -h, --help                                    查看帮助信息
  --region=ap-shanghai|ap-guangzhou|ap-beijing  [default: ap-shanghai] 地域
```

### 实际举例

在 wxrun-id 环境下上传本地 /foo/bar/baz 目录下的所有文件到对象存储的根目录下。

```bash:no-line-numbers
wxcloud storage:upload /foo/bar/baz --envId=wxrun-id --mode=storage --remotePath=/
```