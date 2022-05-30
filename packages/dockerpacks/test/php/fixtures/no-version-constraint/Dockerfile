# 由 Dockerpacks 自动生成
# 本 Dockerfile 可能不能完全覆盖您的项目需求，若遇到问题请根据实际情况修改或询问客服

# 使用 php 官方提供的镜像，内置 fpm
FROM php:7.4-fpm

# 安装 install-php-extensions 工具，您可以使用它来安装自己需要的 php 扩展，请参考：https://github.com/mlocati/docker-php-extension-installer
# 例如，使用 RUN install-php-extensions @composer 来安装 composer
ADD https://dockerpacks-server-1178816-1304825656.ap-shanghai.run.tcloudbase.com/gh/mlocati/docker-php-extension-installer@latest/install-php-extensions /usr/local/bin

RUN chmod +x /usr/local/bin/install-php-extensions

# 设置容器内的当前目录
WORKDIR /app

# 将包括源文件在内的所有文件拷贝到容器中
COPY . .

# 安装数据库模块
RUN install-php-extensions pdo_mysql

# 安装 nginx
RUN apt update -qq && apt install -qq -y --no-install-recommends nginx

# 将 nginx 日志输出到标准输出流和标准错误流中，这是容器应用中推荐的实践
RUN ln -sf /dev/stdout /var/log/nginx/access.log && ln -sf /dev/stderr /var/log/nginx/error.log

# 用生成的 nginx.conf 替换掉默认配置，您可以随时修改生成的 nginx.conf 文件
COPY wxcloudrun-files/nginx.conf /etc/nginx/nginx.conf

# 安装 composer
RUN install-php-extensions @composer

# 移除容器中的 vendor 文件夹
RUN rm -rf vendor

# 使用 composer 重新安装依赖
RUN composer install --no-dev --no-progress --no-interaction --optimize-autoloader

# 后台启动 fpm，然后前台启动 nginx
CMD ["sh", "-c", "php-fpm -D && nginx -g 'daemon off;'"]

# 服务暴露的端口
EXPOSE 80