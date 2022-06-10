# 微信云托管本地调试插件

支持[微信云托管](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/basic/intro.html)容器的[本地调试](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/basic/localdebug.html)。

# 快速开始

```bash
nvm use
npm install
```

VSCode 需要安装 esbuild problem matcher，完成后 F5 启动调试即可。

# 编译和打包

```bash
npm run build-public
npm run build-ide
npm i -g vsce
vsce package

```

# 发布

```
vsce publish
```

vsce pat 在 https://iwiki.woa.com/pages/viewpage.action?pageId=991679176

发布前建议通过 Install from VSIX 自行测试功能正常后再发布。