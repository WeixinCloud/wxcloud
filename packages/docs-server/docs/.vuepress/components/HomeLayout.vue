<script setup lang="ts">
import 'virtual:windi.css'

import { useClipboard } from '@vueuse/core'
import { onUpdated, reactive, ref } from 'vue';

interface CommandHistoryItem {
  commandLine: string;
  result: string;
}

const INSTALL_COMMAND = 'npm i -g @wxcloud/cli';
const { copy } = useClipboard({ source: INSTALL_COMMAND });
const command = ref('');
const state = reactive({ copied: false });
const commandHistory = ref<CommandHistoryItem[]>([]);

function onCommand() {
  const trimmed = command.value.trim();
  const commandLine = `$ ${trimmed}`;

  command.value = '';

  if (!trimmed) {
    commandHistory.value.push({
      commandLine,
      result: ''
    })
    return;
  }

  if (trimmed !== 'wxcloud help') {
    if (trimmed.startsWith('wxcloud')) {
      commandHistory.value.push({
        commandLine,
        result: `请安装 @wxcloud/cli 体验全部功能`
      });
      return;
    }
    commandHistory.value.push({
      commandLine,
      result: `'${trimmed}' command not found`
    });
    return;
  }

  commandHistory.value.push({
    commandLine,
    result: `微信云托管 CLI 工具

VERSION
  @wxcloud/cli

USAGE
  $ wxcloud [COMMAND]

TOPICS
  env       查看环境列表
  function  创建云函数
  run       创建版本
  service   配置服务
  storage   上传对象存储
  version   获取版本列表

COMMANDS
  deploy   部署项目
  help     display help for wxcloud
  init     初始化项目目录
  login    登录 CLI 工具
  logout   登出 CLI
  migrate  迁移项目到云托管`
  });
}
function onCopy() {
  copy()
  state.copied = true
}
</script>

<template>
  <header class="text-xl  mx-auto px-256px bg-white">
    <div class="flex place-items-center justify-between pt-40px">
      <a href="/" class="text-black text-xl flex place-items-center">
        <img src="/images/logo.svg" alt="CLI Logo" class="w-40px" />
        <span class="ml-4">微信云托管 CLI</span>
      </a>
      <ul class="list-none flex space-x-12 text-xl">
        <li>
          <a class="font-500 text-gray" href="/cli/guide">文档</a>
        </li>
        <li>
          <a class="font-500 text-gray" href="https://cloud.weixin.qq.com/cloudrun" target="_blank">云托管控制台</a>
        </li>
      </ul>
    </div>
  </header>
  <main class="text-xl bg-white">
    <section class="py-88px  mx-auto px-256px">
      <div class="flex justify-between">
        <div class="flex-none flex flex-col gap-24px">
          <h1 class="m-0 color-black text-3xl font-bold">使用微信云托管 CLI<br>部署你的服务</h1>
          <span class="text-gray-500">将任意代码容器化并运行在云托管中</span>
          <div class="flex place-items-center">
            <div class="border border-1 border-#707070 rounded-6px px-16px py-12px font-mono flex items-center">
              <span class="pointer-events-none select-none mr-8px">$ </span>
              <span class="mr-24px">{{ INSTALL_COMMAND }}</span>
              <img @click="onCopy" class="cursor-pointer" src="/images/copy_icon.svg" />
            </div>
            <span class="ml-4 opacity-60" v-if="state.copied">已复制 ✓</span>
          </div>
          <a href="/cli/guide">
            <div role="button" class="primary-button">
              查看文档
            </div>
          </a>
        </div>
        <div class="flex-none">
          <div class="w-580px h-405px rounded-12px p-24px bg-slate-800 text-white font-mono overflow-y-auto">
            <p class="my-0 text-gray-300"># 安装 @wxcloud/cli</p>
            <p class="mt-0 mb-18px">$ npm install -g @wxcloud/cli</p>
            <p class="my-0 text-gray-300"># 部署到云托管</p>
            <p class="mt-0 mb-18px">$ wxcloud deploy</p>
            <p class="my-0 text-gray-300"># 输入 `wxcloud help` 来查看所有命令</p>
            <template v-for="item of commandHistory">
              <p class="my-0">{{ item.commandLine }}</p>
              <p class="my-0 mb-18px color-#eaecef"><pre class="m-0 font-mono">{{ item.result }}</pre></p>
            </template>
            <p class="mt-0 mb-18px">$&nbsp;<input
                class="outline-none border-none bg-transparent text-white text-xl font-mono" v-model="command"
                @keydown.enter="onCommand" /><span></span></p>
          </div>
        </div>
      </div>
    </section>
    <section class="py-88px bg-gray-100">
      <div class=" mx-auto px-256px grid grid-cols-3 gap-64px">
        <div class="space-y-4">
          <h3 class="text-3xl color-black">轻松部署</h3>
          <p>
            无需编写 Dockerfile 配置和繁琐的上线流程，只需要选择你喜爱的框架，执行 wxcloud deploy，即可轻松部署到云托管。
          </p>
        </div>
        <div class="space-y-4">
          <h3 class="text-3xl color-black">性能优越</h3>
          <p>支持利用 CDN 分发静态文件，充分利用全球加速和服务端完整能力的优势，降低容器流量使用和负载。</p>
        </div>
        <div class="space-y-4">
          <h3 class="text-3xl color-black">容器化伸缩</h3>
          <p>每一个云托管服务都是容器化的，利用云托管的自动扩缩容能力，可以让你的业务无惧流量波动，自动伸缩，无需操心运维和预估流量。</p>
        </div>
      </div>
    </section>
    <section class="py-120px">
      <div class=" mx-auto px-256px grid grid-cols-3 gap-64px place-items-center">
        <div class="space-y-4">
          <h3 class="text-3xl color-black">无需容器化知识<br>业务代码轻松上云</h3>
          <p>
            云托管 CLI 借助内置的项目特征集，结合云托管最佳实践，能够自动分析现有项目并自动生成可用的 Dockerfile。
          </p>
        </div>
        <img class="col-span-2 block w-full" src="/images/detect.svg" />
      </div>
    </section>
    <section class="bg-green-500 py-88px">
      <div class="mx-auto px-256px grid grid-cols-3 gap-24px">
        <div class="col-span-2 grid grid-cols-4 grid-rows-2 gap-32px">
          <div class="framework-card">
            <img class="block w-full h-full max-w-84px" src="/images/hexo.svg" />
          </div>
          <div class="framework-card">
            <img class="block w-full h-full max-w-84px" src="/images/nuxt.svg" />
          </div>
          <div class="framework-card">
            <img class="block w-full h-full max-w-84px" src="/images/react.svg" />
          </div>
          <div class="framework-card">
            <img class="block w-full h-full max-w-84px" src="/images/vue.svg" />
          </div>
          <div class="framework-card">
            <img class="block w-full h-full max-w-84px" src="/images/angular.svg" />
          </div>
          <div class="framework-card">
            <img class="block w-full h-3/4 max-w-84px" src="/images/svelte.svg" />
          </div>
          <div class="framework-card">
            <img class="block w-full h-full max-w-84px" src="/images/next.svg" />
          </div>
          <div class="framework-card py-0 px-0">
            <img class="block w-full h-full max-w-84px" src="/images/django.svg" />
          </div>
        </div>
        <div class="ml-48px space-y-4">
          <h3 class="text-3xl text-white">支持大多数常见框架<br>无语言限制</h3>
          <p class="text-white">
            在云托管上使用你喜欢的服务端、前端、全栈框架，无需运维管理，将你从各种基础架构工作中解放出来。
          </p>
        </div>
      </div>
    </section>
    <section class="px-64px py-88px">
      <div class=" mx-auto grid place-items-center">
        <div class="flex flex-col items-center space-y-6">
          <h3 class="text-3xl color-black">使用云托管部署你的下一个服务</h3>
          <a href="https://cloud.weixin.qq.com/cloudrun" target="_blank">
            <div role="button" class="primary-button">
              立即体验
            </div>
          </a>
        </div>
      </div>
    </section>
  </main>
  <footer>
    <div class="text-center text-gray-500 p-64px">
      MIT Licensed | Copyright © 2022 WeChat CloudRun. All Rights Reserved
    </div>
  </footer>
</template>

<style scoped>
</style>
