<script setup lang="ts">
import 'virtual:windi.css'

import { useClipboard } from '@vueuse/core'
import { onMounted, onUpdated, reactive, ref } from 'vue';



interface CommandHistoryItem {
  commandLine: string;
  result: string;
}

const INSTALL_COMMAND = 'npm i -g @wxcloud/cli';
const { copy } = useClipboard({ source: INSTALL_COMMAND });

const state = reactive({ copied: false, activeTab: 'npm' });


function onSwitchTab(tab: string) {
  state.activeTab = tab
}

const promptContainerRef = ref<HTMLDivElement>(null!);
const showingPrompt = ref(false);
const promptInputRef = ref<HTMLInputElement>(null!);
const command = ref('');
const commandHistory = ref<CommandHistoryItem[]>([]);
const scrollToBottom = ref(false);


function onCopy() {
  const commands = {
    npm: 'npm install -g @wxcloud/cli',
    yarn: 'yarn global add @wxcloud/cli',
    pnpm: 'pnpm install -g @wxcloud/cli'
  }
  copy(commands[state.activeTab])
  state.copied = true
  setTimeout(() => {
    state.copied = false
  }, 5000)
}

onUpdated(() => {
  if (showingPrompt.value && promptInputRef.value) {
    promptInputRef.value.focus();
  }
  if (scrollToBottom.value) {
    scrollToBottom.value = false;
    promptContainerRef.value.scrollTop = promptContainerRef.value.scrollHeight;
  }
})

onMounted(() => {
  showingPrompt.value = true
})

function onCommand() {
  const trimmed = command.value.trim();
  const commandLine = `$ ${trimmed}`;

  command.value = '';
  scrollToBottom.value = true;

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
</script>

<template>
  <div class="min-w-880px text-xl relative bg-white z-0">
    <!-- background -->
    <div class="absolute h-1080px w-full bg-gradient-to-b from-green-100/5 to-transparent -z-1 banner-bg" />
    <div class="absolute h-1080px w-full bg-gradient-to-b from-green-100/5 to-transparent -z-2" />
    <header class="section text-gray-700">
      <div class="flex place-items-center justify-between pt-40px">
        <a href="/" class="text-black text-xl flex place-items-center">
          <!-- <img src="/images/logo.svg" alt="CLI Logo" class="w-40px" /> -->
          <span>微信云托管 CLI</span>
        </a>
        <ul class="list-none flex space-x-8 text-lg m-0">
          <li>
            <a class="font-400 text-black" href="/cli/guide">文档</a>
          </li>
          <li>
            <a class="font-400 text-black" href="https://github.com/WeixinCloud/wxcloud" target="_blank">GitHub</a>
          </li>
          <li>
            <a class="font-400 text-black" href="https://cloud.weixin.qq.com/cloudrun" target="_blank">云托管控制台</a>
          </li>
        </ul>
      </div>
    </header>
    <main class="text-gray-700">
      <section class="py-80px section">
        <div class="flex justify-between items-center">
          <div class="flex-none flex flex-col gap-24px mr-48px">
            <h1 class="m-0 text-dark-900 text-5xl font-700">使用微信云托管 CLI<br>部署你的服务</h1>
            <span class="text-gray-500">将任意代码容器化并运行在云托管中</span>
            <a href="/cli/guide" class="w-max">
              <div role="button" class="primary-button">
                查看文档
              </div>
            </a>
          </div>
          <div class="flex-none">
            <div ref="promptContainerRef" class="w-320px h-240px xl:w-600px xl:h-360px rounded-12px p-24px slate-background text-white font-mono overflow-y-auto">
              <!-- macos like header -->
              <div class="flex space-x-2 mb-8">
                <span class="rounded-full w-12px h-12px bg-white/20"></span>
                <span class="rounded-full w-12px h-12px bg-white/20"></span>
                <span class="rounded-full w-12px h-12px bg-white/20"></span>
              </div>
              <p class="my-0 text-white/30"># 安装 @wxcloud/cli</p>
              <p class="mt-0 mb-18px"><span class="select-none">$</span> <span class="text-orange-400">npm</span> install <span class="text-green-500">-g</span> @wxcloud/cli</p>
              <p class="my-0 text-white/30"># 部署到云托管</p>
              <p class="mt-0 mb-18px"><span class="select-none">$</span> wxcloud deploy</p>
              <p class="my-0 text-white/30"># 输入 `wxcloud help` 来查看所有命令</p>
              <template v-for="item of commandHistory">
                <p class="my-0">{{ item.commandLine }}</p>
                <p class="my-0 mb-18px text-gray-300">
                <pre class="m-0 font-mono">{{ item.result }}</pre>
                </p>
              </template>
              <p class="mt-0 mb-18px last:mb-0 cursor-text flex items-baseline" @click="showingPrompt = true">
                $&nbsp;<span class="text-xl cursorContainer" v-if="!showingPrompt">{{
                  command.replace(/ /g, '&nbsp;')
                }}</span><input v-if="showingPrompt" ref="promptInputRef" :size="command.length" :style="{ width: !command.length ? 0 : 'auto', padding: 0 }" class="outline-none border-none bg-transparent text-white text-xl font-mono caret-transparent" autocorrect="off" autocomplete="off" spellcheck="false" v-model="command" @keydown.enter="onCommand" @focusout="showingPrompt = false" /><span class="cursor" :style="{ marginLeft: !command ? '0' : (showingPrompt ? '-4px' : '3px') }"></span></p>
            </div>
          </div>
        </div>
        <div class="mt-120px px-8 bg-white/40 rounded-2xl h-224px mx-auto border-1 border-solid border-black/5 light-shadow">
          <p class="font-500 text-md">快速开始</p>
          <div class="text-sm font-medium text-center text-gray-500 border-b-1 border-gray-200">
            <ul class="flex flex-wrap -mb-px list-none pl-0">
              <li class="mr-4">
                <a @click="onSwitchTab('npm')" class="tab" :class="{ 'active-tab': state.activeTab === 'npm' }">npm</a>
              </li>
              <li class="mr-4">
                <a @click="onSwitchTab('yarn')" :class="{ 'active-tab': state.activeTab === 'yarn' }" class="tab">yarn</a>
              </li>
              <li class="mr-4">
                <a @click="onSwitchTab('pnpm')" :class="{ 'active-tab': state.activeTab === 'pnpm' }" class="tab">pnpm</a>
              </li>
            </ul>
          </div>
          <div class="flex justify-between">
            <p v-if="state.activeTab === 'npm'" class="mt-8 font-mono text-md"><span class="text-orange-400">npm</span> install <span class="text-green-500">-g</span> @wxcloud/cli</p>
            <p v-if="state.activeTab === 'yarn'" class="mt-8 font-mono text-md"><span class="text-orange-400">yarn</span> global <span class="text-orange-500">add</span> @wxcloud/cli</p>
            <p v-if="state.activeTab === 'pnpm'" class="mt-8 font-mono text-md"><span class="text-orange-400">pnpm</span> install <span class="text-green-500">-g</span> @wxcloud/cli</p>
            <div class="flex py-8">
              <span class="mr-4 opacity-60" v-if="state.copied">已复制 ✓</span>
              <img @click="onCopy" class="cursor-pointer h-30px" src="/images/copy_icon.svg" />
            </div>
          </div>
        </div>
      </section>
      <section class="py-80px">
        <div class="section">
          <h2 class="border-none py-12">产品优势</h2>
          <div class="grid grid-cols-3 grid-flow-col gap-x-6">
            <div class="py-12 px-8 border-black/5 border-solid rounded-2xl">
              <img class="h-36px" src="/images/deployment_icon.svg" />
              <h3 class="text-xl">轻松部署</h3>
              <p class="text-base text-gray-500">选择你喜爱的框架，执行 wxcloud deploy，即可轻松部署到云托管。</p>
            </div>
            <div class="py-12 px-8 border-black/5 border-solid rounded-2xl">
              <img class="h-36px" src="/images/performance_icon.svg" />
              <h3 class="text-xl">性能优越</h3>
              <p class="text-base text-gray-500">支持利用 CDN 分发静态文件，降低容器流量使用和负载。</p>
            </div>
            <div class="py-12 px-8 border-black/5 border-solid rounded-2xl">
              <img class="h-36px" src="/images/elasticity.svg" />
              <h3 class="text-xl">容器化伸缩</h3>
              <p class="text-base text-gray-500">自动扩缩容能力，让业务无惧流量波动，无需操心运维和预估流量。</p>
            </div>
          </div>
        </div>
      </section>
      <section class="py-80px section space-y-12">
        <div class="flex flex-col h-400px card-1 px-12 justify-center">
          <h3 class="text-3xl font-700 mb-4">
            无需容器化知识<br />业务代码轻松上云
          </h3>
          <p class="text-base text-gray-500 max-w-480px">云托管 CLI 借助内置的项目特征集，结合云托管最佳实践，能够自动分析现有项目并自动生成可用的 Dockerfile。</p>
        </div>
        <div class="flex flex-col h-400px card-2 px-12 justify-center">
          <h3 class="text-3xl font-700 mb-4">
            无语言限制<br />支持市面常见框架
          </h3>
          <p class="text-base text-gray-500 max-w-480px">在云托管上使用你喜欢的服务端、前端、全栈框架，无需运维管理，将你从各种基础架构工作中解放出来。 </p>
        </div>
      </section>
      <section class="py-80px section">
        <div class="flex flex-col h-230px card-3 items-center justify-center">
          <h3 class="text-2xl font-700 text-green-500 text-center">
            使用云托管部署你的下一个服务
          </h3>
          <a href="https://cloud.weixin.qq.com/cloudrun" target="_blank">
            <button class="cursor-pointer text-base w-150px h-40px bg-transparent border-green-500 border-solid border-width-1px text-green-500 py-2 px-6 rounded">开始体验</button>
          </a>
        </div>
      </section>

    </main>
    <footer>
      <div class="text-center text-gray-500 p-64px text-sm">
        MIT Licensed | Copyright © 2022-2023 WeChat CloudRun. All Rights Reserved
      </div>
    </footer>
  </div>
</template>

<style scoped>
.slate-background {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(136.6deg, rgba(57, 71, 98, 1) 0%, rgba(34, 45, 66, 1) 100%);
  /* background: radial-gradient(365.4% 170.2% at 104.6% 100%, rgba(183,255,251,0) 35%, rgba(183,255,251,0.15) 100%); */
  box-shadow: 0 48px 40px -18px rgba(19, 28, 46, 0.1);
}

.border-b-1,
.border-b-2,
.tab {
  border-bottom-style: solid;
}

.light-shadow {
  box-shadow: 0 20px 40px 0 rgba(0, 72, 114, 0.02);
  ;
}

.card-1 {
  background-image: url("/images/banner_bg_1@2x.png");
  background-size: contain;
  background-repeat: no-repeat;
}

.card-2 {
  background-image: url("/images/banner_bg_2@2x.png");
  background-size: contain;
  background-repeat: no-repeat;
}

.card-3 {
  background-image: url("/images/banner_bg_3@2x.png");
  background-size: contain;
  background-repeat: no-repeat;
}

.banner-bg {
  background-image: url("/images/banner_img.svg");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: 85% -70%;
  background-size: 800px 1000px;
}

.cursor {
  display: inline-block;
  width: 0.5em;
  line-height: 100%;
  align-self: stretch;
  padding: 4px 0;
  background-clip: content-box;
  animation-name: blink;
  animation-duration: 600ms;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-timing-function: ease-in;
}

@keyframes blink {
  from {
    background-color: rgba(255, 255, 255, 0.95);
  }

  to {
    background-color: rgba(255, 255, 255, 0.05);
  }
}
</style>
