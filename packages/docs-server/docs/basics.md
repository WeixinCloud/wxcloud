# 快速上手

本教程中，将介绍如何使用 `@wxcloud/cli` 结合 `Next.js` 快速搭建一个网站。

## 创建一个 Next.js 应用

要创建一个 Next.js 应用，只需要打开终端并 `cd` 到您的项目目录，然后运行以下命令：

```:no-line-numbers
npx create-next-app next-app-demo --use-npm
```

## 开发并预览项目

此时你已经创建了一个 `next-app-demo` 的目录，使用 `cd` 命令进入项目：
  
```:no-line-numbers
cd next-app-demo
```

然后，运行如下命令：
```:no-line-numbers
npm run dev
```

此时你已经成功运行 Next.js 的开发服务器，你可以在浏览器中访问 `http://localhost:3000` 来查看项目。

## 迁移到云托管

到此为止，你已经完成了一个简单的 Next.js 应用的创建和开发，但是你还没有将其迁移到云托管中。

执行如下命令，迁移到云托管：

```:no-line-numbers
wxcloud migrate
```

`@wxcloud/cli` 会自动识别到应用的框架，并生成 `Dockerfile` 和 `wxcloud.config.js` 文件。

## 部署到云托管

默认的部署模式为[云托管模式](./features/config.md#type)，即将 Next.js 服务端部署到云托管服务中。可以通过修改 `wxcloud.config.js` 修改默认的部署模式。

执行如下命令，部署项目到云托管：
```:no-line-numbers
wxcloud deploy
```

跟随交互式 CLI 的提示，选择需要部署到的环境和服务，即可完成部署。

部署完成后，CLI 会提示服务域名，点击即可在浏览器中查看部署效果。