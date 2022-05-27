# 项目配置

`@wxcloud/cli` 支持项目配置文件，你可以在 `wxcloud.config.js` 文件中配置项目相关信息。

使用 `wxcloud migrate` 可自动生成默认的配置文件。

## 支持的配置类型

以下配置后缀都是被支持的，优先级从上到下。

- `wxcloud.config.cjs`
- `wxcloud.config.js`
- `wxcloud.config.json`

## 配置示例

```json
{
    "type": "universal",
    "server": ".",
    "client": {
        "customDomain": "cdn.example.com"
    }
}
```

字段 | 说明 | 示例值
--- | --- | ---
type | 项目目标，全栈渲染 universal，前端 static，后台 run | universal
server | Dockerfile 的相对路径 | .
client | 客户端配置 | { customDomain: 'cdn.example.com' }

## 配置项说明

### type

类型：`'universal' | 'static' | 'run' | 'custom'`

使用 `wxcloud deploy` 时使用的部署模式。

- 对于后台项目（`type=run`），部署时会使用项目内的 Dockerfile 文件，部署项目到云托管服务中。
- 对于前端项目（`type=static`），部署时会构建出静态资源，并部署到静态资源托管中。
- 对于混合项目（`type=universal`），部署时会分别将文件上传到静态资源和云托管服务中。
- 对于自定义项目（`type=custom`），请参考 [自定义部署](../terminology/cloudkit.md#自定义部署目标)。

### server

类型：`string | object`

云托管服务的配置，传入 `string` 时作为服务的构建目录，在除 `static` 模式下生效。传入对象时，支持如下参数：

字段 | 说明 | 默认值
--- | --- | ---
port | 端口 | 80
buildDir | 目标目录 | .
versionRemark | 版本备注 | cloudkit

### client

类型：`object`

构建时注入静态域名时的配置，仅在 `universal` 模式时生效。

字段 | 说明 | 示例值
--- | --- | ---
customDomain | 自定义域名 | cdn.example.com

### custom

类型：`object`

自定义部署时的构建目标，仅在 `custom` 模式时生效。

支持的配置如下：

字段 | 说明 | 示例值
--- | --- | ---
staticTarget | 静态资源部署目标 | { '/': 'static' }
runTarget | 后台部署目标 | 'run'