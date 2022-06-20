# function

`wxcloud function` 用于操作云函数。

## function:upload

上传一个云函数（仅云开发环境可用）

### 基本示例

```bash:no-line-numbers
wxcloud function:upload <云函数代码目录>
```

### 命令行参数

支持的命令行参数如下：

```text:no-line-numbers
OPTIONS
  -e, --envId=envId   环境ID
  -h, --help          查看帮助信息
  -n, --name=name     函数名
  --remoteNpmInstall  是否云端安装依赖
```