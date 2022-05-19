# 由 Dockerpacks 自动生成
# 本 Dockerfile 可能不能完全覆盖您的项目需求，若遇到问题请根据实际情况修改或询问客服

# 使用基于 alpine 的 node 官方镜像
FROM node:lts-alpine

# 设置容器内的当前目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production HOST=0.0.0.0

# 运行项目
CMD ["node", "test/index.js"]

# 服务暴露的端口
EXPOSE 3000