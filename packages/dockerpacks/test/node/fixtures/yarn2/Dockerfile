# 由 Dockerpacks 自动生成
# 本 Dockerfile 可能不能完全覆盖您的项目需求，若遇到问题请根据实际情况修改或询问客服

# 使用基于 alpine 的 node 官方镜像
FROM node:lts-alpine

# 设置容器内的当前目录
WORKDIR /app

# 使用国内镜像源加速安装 yarn 2.4.3
RUN npm install -g yarn@2.4.3 --registry="https://registry.npmmirror.com"

# 使用速度更快的国内镜像源
RUN yarn config set npmRegistryServer https://registry.npmmirror.com

# 将这些文件拷贝到容器中
COPY package.json yarn.lock ./

# 安装依赖
RUN yarn install --immutable

# 将包括源文件在内的所有文件拷贝到容器中（在 .dockerignore 中的文件除外）
COPY . .

# 设置环境变量
ENV NODE_ENV=production HOST=0.0.0.0

# 运行项目
CMD ["node", "index.js"]

# 服务暴露的端口
EXPOSE 3000