# 混合部署

`@wxcloud/cli` 支持混合部署模式，即自动将静态资源部署到 CDN，服务端部署到云托管中，充分利用 CDN 加速和服务端完整能力的优势，降低容器流量使用和负载。

![cloudkit](/images/cloudkit.svg)

使用时，需要在 `wxcloud.config.json` 将部署类型指定为 `universal`，参考如下：

```json
{
  "type": "universal",
  "server": {}
}
```

## 支持情况

目前混合部署模式，开箱即用支持以下框架：

- Next.js
- Nuxt.js(v2 & v3)

如果没有自己使用的框架，可以通过[自定义部署目标](#自定义部署目标)实现。

注意：如果在对应的框架配置文件中设置了 `basePath` (Next) 或者 `router.base` (Nuxt2) 或者 `app.baseURL` (Nuxt3)，在部署之后，需要在部署的链接后手动加上对应的 `base` 值才能访问。


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
    // 云托管代码包路径，zip 格式
    runTarget: 'package.zip',
  }
}

module.exports = cloudConfig
```