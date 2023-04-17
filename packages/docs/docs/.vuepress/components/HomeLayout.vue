<script setup lang="ts">
import 'virtual:windi.css'

import { useClipboard, useWindowScroll } from '@vueuse/core'
import { onMounted, onUpdated, reactive, ref } from 'vue';



interface CommandHistoryItem {
  commandLine: string;
  result: string;
}

const INSTALL_COMMAND = 'npm i -g @wxcloud/cli';
const { copy } = useClipboard({ source: INSTALL_COMMAND });

const state = reactive({ copied: false, activeTab: 'npm' });

const { y } = useWindowScroll()

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
    <div class="absolute top-0 h-1080px w-full background -z-1 banner-bg" />
    <div class="absolute top-0 h-1080px w-full background -z-2" />
    <div class="h-20px"></div>
    <header :class="{ 'bg-opacity-70 backdrop-saturate-240 backdrop-blur-40px border-solid': y > 20, 'bg-opacity-0': y <= 20 }" class="sticky top-0 z-1 w-full bg-white transition-all duration-500 ease-in-out backdrop-filter text-gray-700 py-12px border-0 border-b-half border-black/10">
      <div class="h-40px w-full max-w-1224px mx-auto px-4 sm:px-6 lg:px-8 flex place-items-center justify-between ">

        <a href="/" class="text-black text-xl flex place-items-center">
          <img src="/images/nav_logo.svg" alt="CLI Logo" />
          <!-- <span>微信云托管 CLI</span> -->
        </a>
        <ul class="list-none flex space-x-8 text-lg m-0">
          <li>
            <a class="font-normal text-dark text-base leading-6" href="/cli/guide">文档</a>
          </li>
          <li>
            <a class="font-normal text-dark text-base leading-6" href="https://github.com/WeixinCloud/wxcloud" target="_blank">GitHub</a>
          </li>
          <li>
            <a class="font-normal text-dark text-base leading-6" href="https://cloud.weixin.qq.com/cloudrun" target="_blank">云托管控制台</a>
          </li>
        </ul>

      </div>
    </header>
    <main class="pt-24px text-gray-700">
      <section class="py-80px mx-auto w-full max-w-1224px">
        <div class="flex justify-between items-center">
          <div class="flex-none flex flex-col gap-24px mr-48px">
            <h1 class="m-0 text-dark-900 text-5xl font-700">使用微信云托管 CLI<br>部署你的服务</h1>
            <span class="text-gray-500">将任意代码容器化并运行在云托管中</span>
            <a href="/cli/guide" class="w-max mt-16px">
              <div role="button" class="bg-green-500 hover:bg-green-600 transition-all text-base w-184px h-48px text-white rounded-8px cursor-pointer grid place-items-center">
                查看文档
              </div>
            </a>
          </div>
          <div class="flex-none">
            <div class="flex flex-col box-border w-320px h-240px xl:w-600px xl:h-360px rounded-12px p-24px slate-background text-white font-mono overflow-y-auto">
              <!-- macos like header -->
              <div class="flex space-x-2">
                <span class="rounded-full w-12px h-12px bg-white/20"></span>
                <span class="rounded-full w-12px h-12px bg-white/20"></span>
                <span class="rounded-full w-12px h-12px bg-white/20"></span>
              </div>
              <div class="flex-1 w-full overflow-auto mt-32px scrollbar text-size-16px" ref="promptContainerRef">
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
        </div>
        <div class="mt-120px px-8 py-24px bg-white/40 rounded-2xl mx-auto border-solid border-half backdrop-filter backdrop-blur-10px border-black/10 light-shadow">
          <p class="m-0 font-500 text-2xl leading-10 text-black/90 ">快速开始</p>
          <div class="h-48px border-inset text-sm font-medium text-center text-gray-500 border-solid border-0 border-b-half border-gray-200">
            <ul class="h-full mt-0 flex flex-wrap -mb-px list-none pl-0">
              <li class="mr-6">
                <a @click="onSwitchTab('npm')" class="tab" :class="{ 'active-tab': state.activeTab === 'npm' }">npm</a>
              </li>
              <li class="mr-6">
                <a @click="onSwitchTab('yarn')" :class="{ 'active-tab': state.activeTab === 'yarn' }" class="tab">yarn</a>
              </li>
              <li class="mr-6">
                <a @click="onSwitchTab('pnpm')" :class="{ 'active-tab': state.activeTab === 'pnpm' }" class="tab">pnpm</a>
              </li>
            </ul>
          </div>
          <div class="flex justify-between mt-40px mb-24px">
            <p v-if="state.activeTab === 'npm'" class="m-0 font-mono text-md"><span class="text-orange-400">npm</span> install <span class="text-green-500">-g</span> @wxcloud/cli</p>
            <p v-if="state.activeTab === 'yarn'" class="m-0 font-mono text-md"><span class="text-orange-400">yarn</span> global <span class="text-orange-500">add</span> @wxcloud/cli</p>
            <p v-if="state.activeTab === 'pnpm'" class="m-0 font-mono text-md"><span class="text-orange-400">pnpm</span> install <span class="text-green-500">-g</span> @wxcloud/cli</p>
            <div class="flex place-items-center">
              <span class="mr-4 opacity-60 text-base leading-6" v-if="state.copied">已复制 ✓</span>
              <img @click="onCopy" class="cursor-pointer h-24px" src="/images/copy_icon.svg" />
            </div>
          </div>
        </div>
      </section>
      <section class="py-80px">
        <div class="mx-auto w-full max-w-1224px">
          <h2 class="border-none font-medium text-28px leading-10 tracking-wide mt-0">产品优势</h2>
          <div class="grid grid-cols-3 grid-flow-col gap-x-6">
            <div class="feature-card">
              <img class="h-40px" src="/images/deployment_icon.svg" />
              <h3 class="font-medium mt-4 mb-2 text-20px leading-7 tracking-wider text-black text-opacity-90">轻松部署</h3>
              <p class="m-0 font-normal text-16px leading-6 text-black text-opacity-70">选择你喜爱的框架，执行 wxcloud deploy，即可轻松部署到云托管。</p>
            </div>
            <div class="feature-card">
              <img class="h-40px" src="/images/performance_icon.svg" />
              <h3 class="font-medium mt-4 mb-2 text-20px leading-7 tracking-wider text-black text-opacity-90">性能优越</h3>
              <p class="m-0 font-normal text-16px leading-6 text-black text-opacity-70">支持利用 CDN 分发静态文件，降低容器流量使用和负载。</p>
            </div>
            <div class="feature-card">
              <img class="h-40px" src="/images/elasticity.svg" />
              <h3 class="font-medium mt-4 mb-2 text-20px leading-7 tracking-wider text-black text-opacity-90">容器化伸缩</h3>
              <p class="m-0 font-normal text-16px leading-6 text-black text-opacity-70">自动扩缩容能力，让业务无惧流量波动，无需操心运维和预估流量。</p>
            </div>
          </div>
        </div>
      </section>
      <section class="py-80px mx-auto w-full max-w-1224px space-y-12">
        <div class="flex flex-col h-400px card-1 px-12 justify-center">
          <h3 class="font-semibold text-32px leading-11 tracking-wider text-black text-opacity-80 mb-0">
            无需容器化知识<br />业务代码轻松上云
          </h3>
          <p class="font-normal text-16px leading-7 text-black text-opacity-55 max-w-480px">云托管 CLI 借助内置的项目特征集，结合云托管最佳实践，能够自动分析现有项目并自动生成可用的 Dockerfile。</p>
        </div>
        <div class="flex flex-col h-400px card-2 px-12 justify-center">
          <h3 class="font-semibold text-32px leading-11 tracking-wider text-black text-opacity-80 mb-0">
            无语言限制<br />支持市面常见框架
          </h3>
          <p class="font-normal text-16px leading-7 text-black text-opacity-55 max-w-480px">在云托管上使用你喜欢的服务端、前端、全栈框架，无需运维管理，将你从各种基础架构工作中解放出来。 </p>
        </div>
      </section>
      <section class="py-80px mx-auto w-full max-w-1224px">
        <div class="flex flex-col h-240px card-3 items-center justify-center">
          <h3 class="text-2xl font-700 text-green-500 text-center">
            使用云托管部署你的下一个服务
          </h3>
          <a href="https://cloud.weixin.qq.com/cloudrun" target="_blank">
            <button class="tracking-wide cursor-pointer text-16px leading-6 w-150px h-40px bg-transparent border-green-500 border-opacity-70 border-solid border-width-1px text-green-500 py-2 px-6 rounded-8px">开始体验</button>
          </a>
        </div>
      </section>

    </main>
    <footer>
      <div class="text-center text-gray-500 pt-64px pb-160px text-sm">
        MIT Licensed | Copyright © 2022-2023 WeChat CloudRun. All Rights Reserved
      </div>
    </footer>
  </div>
</template>

<style scoped>
.background {
  background: linear-gradient(180deg, rgba(7, 193, 96, 0.05) -8.57%, rgba(7, 193, 96, 0) 58.62%), linear-gradient(195.82deg, rgba(211, 239, 255, 0.2) 2.24%, rgba(255, 255, 255, 0) 61.55%);
}
.slate-background {
  border: 0.5px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(136.6deg, rgba(57, 71, 98, 1) 0%, rgba(34, 45, 66, 1) 100%);
  /* background: radial-gradient(365.4% 170.2% at 104.6% 100%, rgba(183,255,251,0) 35%, rgba(183,255,251,0.15) 100%); */
  box-shadow: 0 48px 40px -18px rgba(19, 28, 46, 0.1);
}

.border-b-1,
.border-b-2,
.tab {
  border-bottom-style: solid;
  display: flex;
}

.tab {
  place-items: center;
}

.light-shadow {
  box-shadow: 0 20px 40px 0 rgba(0, 72, 114, 0.02);
  ;
}

.card-1 {
  background-image: url("/images/banner_bg_1@2x.png");
  background-size: cover;
  background-repeat: no-repeat;
}

.card-2 {
  background-image: url("/images/banner_bg_2@2x.png");
  background-size: cover;
  background-repeat: no-repeat;
}

.card-3 {
  background-image: url("/images/banner_bg_3@2x.png");
  background-size: cover;
  background-repeat: no-repeat;
}

.banner-bg {
  background-image: url("/images/banner_img.svg");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: 84% 800%;
  background-size: 1022px 1101px;
}

.cursor {
  display: inline-block;
  width: 0.3em;
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


/* total width */
.scrollbar::-webkit-scrollbar {
    background-color: transparent;
    width: 4px;
}

/* background of the scrollbar except button or resizer */
.scrollbar::-webkit-scrollbar-track {
    background-color: transparent;
}

/* scrollbar itself */
.scrollbar::-webkit-scrollbar-thumb {
    background-color: #babac0;
    border-radius: 16px;
}

/* set button(top and bottom of the scrollbar) */
.scrollbar::-webkit-scrollbar-button {
    display:none;
}
</style>
