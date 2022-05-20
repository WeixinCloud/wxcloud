# Dockerpacks

`@wxcloud/dockerpacks` 是 `@wxcloud/cli` 生成 `Dockerfile` 所使用的组件。

## Dockerpacks 是什么？

对于已有的服务端项目，需要在云托管运行之前，需要先编写 Dockerfile。然而，对于普通用户而言，需要学习 Dockerfile 的相关语法，并根据项目依赖，选择基础镜像，使用 `RUN`, `COPY` 和 `CMD` 等指令编写 Dockerfile，有一定的学习门槛。

受 Heroku Buildpacks/CNB Buildpacks 启发，我们开发了一套类似的自动检测项目的组件，通过内置的项目特征集，我们可以自动生成可用的 Dockerfile。

## Dockerpacks 是如何工作的？

![dockerpacks](/images/dockerpacks.svg)

Dockerpacks 内置了大部分常用语言的特征集（Dockerpack）和对应的 `Dockerfile` 生成规则。

每一个 Dockerpack 都有两个阶段构成：检测阶段和构建阶段。

### 检测阶段

检测阶段（`detect`）会检测源代码是否应该被这个 Dockerpack 参与。一旦检测到适用的 Dockerpack，会执行它的 构建（`build`） 阶段。否则，`build` 阶段将会被跳过。

### 构建阶段

构建阶段（`build`）会根据检测到的代码特征，使用语言/框架所对应的特征，转译成对应 `Dockerfile` 中的各条命令。

举例说明如下：
- Node Dockerpack 检测到 `package.json` 后，会在 Dockerfile 中插入 `RUN npm install`。
- Java Dockerpack 检测到 `settings.xml` 后，会在 Dockerfile 中插入 `RUN mvn package`。

## 与 Buildpacks 的区别

Cloud Native Buildpacks 也是一套通过识别代码，生成容器化应用的方案。在微信云托管中，使用「无 Dockerfile」部署时，使用的方案就是 Buildpacks。

但 Buildpacks 有其自身的局限性：

- 生成的产物是打包好的镜像，无法进行二次修改
- 识别和生成过程是黑盒的，无法自定义或被容易的扩展
- 应用的能力依赖于提供的 Layers，基础镜像往往带有不需要的能力，影响启动速度
- 各个平台之间（Heroku，CNB）提供的 Buildpacks 各不相同，表现不可预期

相比于 Buildpacks，生成 `Dockerfile` 的方案则更加灵活和透明。用户可以按照自身需求，修改生成的 `Dockerfile` 文件，或者对其进行更多的定制。同时，由于产物仅为一个 `Dockerfile`，在任何平台中的表现均是相同的。

## 对 Dockerfile 进行二次修改

对于大多数的常见项目，`Dockerpacks` 生成的 Dockerfile 已包含微信云托管的诸多最佳实践。但是由于项目源代码类型众多，无法保证一一兼容。

在这种情况下，推荐对生成的 Dockerfile 进行微调，以满足自身需求。常见的调整分为以下类型：

- 基础镜像修改：使用更高/更低的版本，或者使用特定的版本号。通过 `FROM` 指令修改。
- 依赖修改：安装运行时依赖，或语言的特定依赖，可以通过 `RUN` 指令修改。
- 环境变量修改：如果是固定的环境变量，可以通过 `ENV` 指令注入。

