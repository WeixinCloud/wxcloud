# migrate

`wxcloud migrate` 能够帮助迁移传统项目到云托管。

通过交互式 CLI，可生成 `Dockerfile` 和项目配置文件 `wxcloud.config.js`。

## 基本用法

```bash:no-line-numbers
wxcloud migrate <项目目录>
```

## 使用说明

默认迁移模式为 `run`，即迁移项目到云托管中。

如需修改迁移模式，可根据项目需要，修改 `wxcloud.config.js(json)` 文件：

```js
/** @type {import('@wxcloud/core').CloudConfig} */
const cloudConfig = {
  server: '.',
  type: 'static', // 修改为纯静态模式
}

module.exports = cloudConfig
```


