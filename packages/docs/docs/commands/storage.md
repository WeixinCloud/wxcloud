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

## storage:list

查询文件列表

### 基本用法
```bash:no-line-numbers
wxcloud storage:list [路径前缀]
```

### 命令行参数

```bash:no-line-numbers
OPTIONS
  -c, --concurrency=concurrency       并发上传数量
  -e, --envId=envId                   环境ID
  -h, --help                          查看帮助信息
  -m, --mode=(staticstorage|storage)  上传模式
  -d, --delimiter                     分隔符
  --max-keys                          最大查询数量
  --marker                            起始对象建标记
  -j, --json                          是否以 JSON 输出
```

补充说明：
| 参数 | 说明 |
| -- | -- |
| --max-keys | 单次返回最大的条目数量，默认1000，最大为1000 |
| --delimiter | 定界符。为一个分隔符号，用于对对象键进行分组。一般是传/。所有对象键从 Prefix 或从头（如未指定 Prefix）到首个 delimiter 之间相同部分的路径归为一类，定义为 Common Prefix，然后列出所有 Common Prefix |
| --marker | 起始对象键标记，列出从 Marker 开始 MaxKeys 条目，默认顺序为 UTF-8 字典序 |
| --json | 如果不提供该参数，则输出文件 key 列表，否则以 JSON 格式输出包含完整元数据信息的文件列表 |


## storage:delete

查询文件列表

### 基本用法
```bash:no-line-numbers
wxcloud storage:delete -o [文件1] -o [文件2]
wxcloud storage:delete -p [路径前缀]
```

### 命令行参数

```bash:no-line-numbers
OPTIONS
  -c, --concurrency=concurrency       并发上传数量
  -e, --envId=envId                   环境ID
  -h, --help                          查看帮助信息
  -m, --mode=(staticstorage|storage)  上传模式
  -o, --object                        文件路径，可传多次
  -p, --prefix                        路径前缀
```

`-o` 和 `-p` 两个参数需要二选一。`-o` 表示删除指定文件。`-p` 表示删除所有指定路径前缀的文件，但每次最多删 1000 个，如果同路径前缀的文件数量超出 1000 个，会给出提示，可重复执行直到完全删除。

### 实际举例

在 wxrun-id 环境下删除文件 `test.json` 和 `demo/tmp.json`。

```bash:no-line-numbers
wxcloud storage:delete --envId=wxrun-id --mode=storage -o test.json -o demo/temp.json
```

在 wxrun-id 环境下删除目录 `demo` 下的所有文件

```bash:no-line-numbers
wxcloud storage:delete --envId=wxrun-id --mode=storage -p demo/
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
