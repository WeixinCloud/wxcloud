# 由 Dockerpacks 自动生成
# 本 Dockerfile 可能不能完全覆盖您的项目需求，若遇到问题请根据实际情况修改或询问客服

# 使用基于 alpine 的 python 官方镜像
FROM python:3-alpine

# 设置容器内的当前目录
WORKDIR /app

# 使用速度更快的国内镜像
RUN python3 -m pip config set global.trusted-host mirrors.cloud.tencent.com&& \
    python3 -m pip config set global.index-url http://mirrors.cloud.tencent.com/pypi/simple

# 将 requirements.txt 复制到容器中
COPY requirements.txt requirements.txt

# 安装依赖
RUN python3 -m pip install -r requirements.txt

# 将所有文件拷贝到容器中
COPY . .

# 启动 django
CMD ["python3", "manage.py", "0.0.0.0"]

# 服务暴露的端口
EXPOSE 3000