# 项目配置

`@wxcloud/cli` 支持项目配置文件，你可以在 `wxcloud.config.js` 文件中配置项目相关信息。

使用 `wxcloud migrate` 可自动生成默认的配置文件。

## 支持的配置类型

以下配置后缀都是被支持的，优先级从上到下。

- `wxcloud.config.cjs`
- `wxcloud.config.js`
- `wxcloud.config.json`

## 配置示例

```js
/** @type {import('@wxcloud/core').CloudConfig} */
module.exports = {
    type: "universal", // 项目目标，全栈渲染 universal，前端 static，后台 run 
    server: ".", // Dockerfile 的相对路径
    client: {
        target: ".next/static", // 上传到 CDN 的路径，支持多个 (string | string[]) 
        domain: "cdn.example.com", // CDN 自定义域名（如果有）
    },
}
```