# 概览

## 简介

微信云服务 CLI 工具能够帮助您……

## 安装

### 环境需求

微信云服务 CLI 工具需要您的电脑上安装有：

- [Node.js v16](https://nodejs.org/zh-cn/) 或更高版本

### 安装命令

输入以下命令即可安装最新版的 CLI：

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

## 登出

当您完成使用之后，推荐手动登出账号：

```:no-line-numbers
wxcloud logout
```