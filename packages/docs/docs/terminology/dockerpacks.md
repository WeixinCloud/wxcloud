# Dockerpacks

`@wxcloud/dockerpacks` 是 `@wxcloud/cli` 生成 `Dockerfile` 所使用的组件。

## Dockerpacks 是什么

对于现有的服务端项目来说，要想迁移到云托管上运行，需要提供 [Dockerfile](https://docs.docker.com/engine/reference/builder/)。后者能够指导像 [Docker](https://www.docker.com/) 这样的容器工具对项目进行[容器化](https://www.redhat.com/zh/topics/cloud-native-apps/what-is-containerization)，方便云托管更好地运行、管理项目。

对用户而言，这需要学习 Dockerfile 的相关语法，并根据项目的实际情况选择基础镜像，再使用 `RUN`, `COPY` 和 `CMD` 等指令编写镜像构建的步骤。我们希望尽可能地为用户免除这些烦恼。

受 [Buildpacks](https://buildpacks.io/) 启发，我们开发了一个类似的工具——Dockerpacks。它可以借助内置的项目特征集，分析用户的项目并自动生成可用的 Dockerfile。

## Dockerpacks 是如何工作的

![dockerpacks](/images/dockerpacks.svg)

Dockerpacks 内置了大部分常用语言或框架的特征集，及其对应的 Dockerfile 构建规则。这些规则以 Builders Group 的形式被组织（以下简称“Group”）。

Dockerfile 的构建由两个阶段构成：检测阶段和构建阶段。

### 检测阶段

检测阶段（detect phrase）会检测源代码是否应该被某个 Group 参与。一旦检测到适用的 Group，会执行它的构建阶段。

### 构建阶段

在构建阶段（build phrase）中，Group 会根据检测到的代码特征，使用语言或框架对应的构建规则，构建 `Dockerfile` 中的各条命令。

举例说明如下：

- Node Group 检测到 `package.json` 后，会在 Dockerfile 中插入 `RUN npm install`。
- Java Group 检测到 `settings.xml` 后，会在 Dockerfile 中插入 `RUN mvn package`。

## 与 Buildpacks 的区别

Buildpacks 也是一套通过识别代码生成容器化应用的方案。在微信云托管中，用户选择「无 Dockerfile」部署时，背后的方案就是 Buildpacks。

Dockerpacks 和 Buildpacks 的本质区别在于：前者的产物是 Dockerfile，后者产物是容器镜像。可是生成 Dockerfile 就是为了构建容器镜像，为什么 Dockerpacks 不像 Buildpacks 那样一步到位呢？我们认为 Buildpacks 存在着一些局限性：

- 生成的产物是打包好的镜像，无法进行二次修改
- 识别和生成过程是黑盒的，无法自定义或被容易的扩展
- 应用的能力依赖于提供的 Layers，基础镜像往往带有不需要的能力，影响启动速度
- 各个平台之间（Heroku、CNB 等）提供的 Buildpacks 各不相同，表现不可预期

相比于 Buildpacks，生成 `Dockerfile` 的方案则更加灵活和透明。用户可以按照自身需求，修改生成的 `Dockerfile` 文件，对其进行更多的定制（Dockerpacks 会自动生成丰富的注释，基本不需要用户掌握相关知识）。

换句话说，Dockerpacks 的产物是一个「描述之后产生的镜像是什么样子」的文件，而 Buildpacks 的产物则是一个「被构建好了，处于完成式」的镜像。

## 对 Dockerfile 进行二次修改

对于大多数的常见项目，`Dockerpacks` 生成的 Dockerfile 已包含微信云托管的诸多最佳实践。但是由于项目源代码类型众多，无法保证一一兼容。

在这种情况下，推荐对生成的 Dockerfile 进行微调，以满足自身需求。常见的调整分为以下类型：

- 基础镜像修改：使用更高/更低的版本，或者使用特定的版本号。通过 `FROM` 指令修改。
- 依赖修改：安装运行时依赖，或语言的特定依赖，可以通过 `RUN` 指令修改。
- 环境变量修改：如果是固定的环境变量，可以通过 `ENV` 指令注入。
