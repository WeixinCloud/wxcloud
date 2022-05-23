# 混合部署

`@wxcloud/cli` 支持混合部署模式，即自动将静态资源部署到 CDN，服务端部署到云托管中，充分利用 CDN 加速和服务端完整能力的优势，降低容器流量使用和负载。

![cloudkit](/images/cloudkit.svg)

## 支持情况

目前混合部署模式，开箱即用支持以下框架：

- Next.js
- Nuxt.js (v3 暂不支持)

如果没有自己使用的框架，可以通过[自定义部署目标](#自定义部署目标)实现。


## 静态资源

在执行 `wxcloud deploy` 时，会获取当前环境的静态资源域名，并替换对应框架的配置文件中 `assetsPrefix` 等字段。在构建完成后，配置文件会恢复原样。

## 自定义部署目标

使用 `custom` 模式，可以自定义需要部署的静态资源和容器代码包，但需要自行配置对应框架的静态资源引用配置，并将需要上传的服务端文件打包成 `zip` 格式。

参考配置如下（`wxcloud.config.js`）：

```js
/** @type {import("@wxcloud/core").CloudConfig} */
const cloudConfig = {
  server: {
    port: 3000, // 端口
    buildDir: '.', // 目标目录
    versionRemark: 'custom-framework', // 版本备注
  },
  type: "custom",
  custom: {
    staticTarget: {
      // 静态资源部署目标，key 为本地目录，value 为远端目录
      public: '',
      '.next/static': '_next/static/'
    },
    // 云托管代码包目录，zip 格式
    runTarget: 'package.zip',
  }
}

module.exports = cloudConfig
```