# login

微信云服务 CLI 使用控制台生成的 CLI Token 进行登录。用户可以到微信云托管/云开发控制台，设置-全局设置中生成 CLI 秘钥并使用（云开发控制台在设置-权限设置）

### 基本用法

```bash:no-line-numbers
wxcloud login --appid <appid>
```
### 命令行参数

```text:no-line-numbers
OPTIONS
  -a, --appId=appId            微信 AppID
  -h, --help                   show CLI help
  -k, --privateKey=privateKey  微信云服务私钥
```

