# env

`wxcloud env` 能够查看和管理环境信息。
## env:list

`wxcloud env:list` 能够列出当前 App 的环境列表，使用此命令前请先登录。

### 基本用法

```bash:no-line-numbers
wxcloud env:list
```

### 命令行参数

支持的命令行参数如下：

```text:no-line-numbers
OPTIONS
  -h, --help                                    查看帮助
  --json                                        是否以json格式展示结果
  --region=ap-shanghai|ap-guangzhou|ap-beijing  [default: ap-shanghai] 地域
```