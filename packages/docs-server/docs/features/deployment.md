# 智能部署

使用 `wxcloud deploy` 部署项目时，CLI 可根据项目配置，自动划分动态服务和静态资源，并进行部署。


```shell:no-line-numbers
$ wxcloud deploy

Wxcloud CLI 2.0.1-beta.15
? 请选择环境 test (test-environment)
? 请选择服务 test-service

<构建日志>

✔ 云托管产物上传
✔ 云托管版本创建
public       | ████████████████████████████████████████ | 2/2 Files
.next/static | ████████████████████████████████████████ | 12/12 Files
✔ 静态资源上传文件成功

部署开始于 2022-05-19 15:40:33

<部署日志>

✔ 部署完成
  服务 cloudkit 访问地址:
  > demo.ap-shanghai.run.tcloudbase.com

```


## 部署模式

- 对于后台项目（`type=run`），部署时会使用项目内的 Dockerfile 文件，部署项目到云托管服务中。
- 对于前端项目（`type=static`），部署时会构建出静态资源，并部署到静态资源托管中。
- 对于混合项目（`type=universal`），部署时会分别将文件上传到静态资源和云托管服务中。

## 混合渲染框架支持

目前 `@wxcloud/cli` 对于混合渲染框架的支持，以下框架经过官方测试：

- Next.js
- Nuxt 2

混合渲染是通过 `@wxcloud/cloudkit` 进行支持的，后续会迭代支持更多的框架。