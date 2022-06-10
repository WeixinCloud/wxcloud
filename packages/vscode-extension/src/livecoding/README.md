# Live Coding

云托管 Live Coding 相关能力

# Tiers

## Tier 1

无配置都需要支持的

- NodeJS 官方模板（Express，Koa）
- Java 官方模板（Spring Boot）

## Tier 2

手动调整后可以支持的

- PHP 官方模板（ThinkPHP，Laravel）
- Python 官方模板（Django，Flask）

## Tier 3

社区支持/自己写 Dockerfile

- .NET Core
- 其他模板

# 实现

根据 Dockerfile 生成 Dockerfile.development + docker-compose.yml

对 Dockerfile 做 pattern matching 找到 `RUN` 命令做入口点，如果找不到就让用户自己填。

把入口点拼到 `nodemon` 命令里面去。

# 对外文档

# 实时开发 <span class="wedoc-beta-tag" style="margin-left: 0; position: relative; bottom: 2px;">Beta</span>

通过 VSCode 插件，可以实现实时开发，即代码变动时，不需要重新构建和启动容器，即可查看变动后的效果。

## 使用教程

1. 安装 VSCode 插件，并更新至最新版本
2. 打开需要开发的项目，目前支持大多数官方模板。
3. 右键 Docker 容器，选择 Live Coding(Beta)
4. 将自动生成 `Dockerfile.development` 和 `docker-compose.yml`，并运行容器。容器启动后，将提示访问地址，点击即可访问服务。
5. 开发完成后，右键 Docker 容器，选择 Stop，即可结束实时开发。

## 开发模式的 Dockerfile

实时开发使用项目目录下的 `Dockerfile.development` 作为开发期间的容器的 `Dockerfile`。

开发模式的 Dockerfile 与正式模式的 Dockerfile 的区别在于：
- 单阶段构建
- 将编译命令转换为启动命令，如 Spring Boot 模板的 `mvn package` 会转换为 `spring-boot:run`
- 拉取实时开发的工具套件，安装到 `/usr/bin` 下

## 开发模式的 docker-compose.yml

实时开发将使用项目目录下的 `docker-compose.yml` 将当前目录映射到容器中。

可以参考如下的 `docker-compose.yml` 结构，按需修改：

```yaml
version: '3'
services:
  app:
    build: 
      context: . # 构建上下文
      dockerfile: Dockerfile.development
    volumes:
      - .:/app # 需要映射的目录（即代码目录）
      - /app/node_modules # 映射 node_modules 目录
    ports:
      - 27081:80 # 监听端口，主机端口：容器端口
    container_name: wxcloud_wxcloudrun-express
    labels: # 容器标签，一般不需改动
      - wxPort=27082
      - hostPort=27081
      - wxcloud=wxcloudrun-express
      - role=container
    environment:
      # 使用本地调试 MySQL 时，需要填入如下环境变量，并启动 MySQL 代理服务
      - MYSQL_USERNAME=
      - MYSQL_PASSWORD=
      - MYSQL_ADDRESS=
# 容器网络打通，一般不需改动
networks:
  default:
    external:
      name: wxcb0
```

## 注意事项、兼容性与 FAQ

实时开发（Beta）目前兼容如下的模板：

- NodeJS 官方模板（Express，Koa）
- Java 官方模板（Spring Boot）
- PHP 官方模板（ThinkPHP，Laravel）
- Python 官方模板（Django，Flask）

其余模板暂时未经过官方测试，可以自行修改生成的 `Dockerfile.development` 和 `docker-compose.yml` 文件使用。

首次使用实时开发时，会自动识别项目内是否已存在 `Dockerfile.development` 和 `docker-compose.yml` 文件，如果存在，则不会生成新的文件。

实时开发也支持 VPC 网络打通和微信开发者工具本地调试，使用方式与普通启动一致。