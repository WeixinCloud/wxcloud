# 概览

## 简介

微信云托管 CLI 工具能够帮助您新建云托管项目，或将已有项目快速迁移到云托管中。同时，它还能帮助您新建云托管服务，更新服务版本，上传文件，或查看服务的状态。

## 安装

### 环境需求

微信云托管 CLI 工具需要您的电脑上安装有：

- [Node.js v16](https://nodejs.org/zh-cn/) 或更高版本

### 安装和更新

输入以下命令即可安装最新版的 CLI，或将已有的版本更新到最新版：

<CodeGroup>
  <CodeGroupItem title="npm" active>

```bash:no-line-numbers
npm i -g @wxcloud/cli
```

  </CodeGroupItem>
  <CodeGroupItem title="yarn">

```bash:no-line-numbers
yarn global add @wxcloud/cli
```

  </CodeGroupItem>
  <CodeGroupItem title="pnpm">

```bash:no-line-numbers
pnpm i -g @wxcloud/cli
```

  </CodeGroupItem>
</CodeGroup>

安装完成后可以在命令行中运行 `wxcloud` 来检查是否安装成功。

## 登录

云服务 CLI 的大多数命令都需要登录之后才能使用，您可以运行下面的命令来进行交互式登录：

```:no-line-numbers
wxcloud login
```

您也可以通过指定命令行参数来登录：

```:no-line-numbers
wxcloud login --appId <微信 AppId> --privateKey <秘钥>
```


CLI工具的登录采用了密钥形式，在使用前需要前往[微信云托管控制台-设置-CLI密钥](https://cloud.weixin.qq.com/cloudrun/settings/other)生成，生成时需要账号管理员扫码，可以新建多个密钥，用于在不同地方使用。

<img style="width:auto" src="/images/cli-key.png"/>

获取的密钥不会在平台中显式保存，所以在新建后需要自己妥善保管。


## 登出

当您完成使用之后，推荐手动登出账号：

```:no-line-numbers
wxcloud logout
```
