import { defaultTheme, defineUserConfig } from 'vuepress';
import { nprogressPlugin } from '@vuepress/plugin-nprogress';
import { backToTopPlugin } from '@vuepress/plugin-back-to-top';
import { rightAnchorPlugin } from 'vuepress-plugin-right-anchor';
import { searchPlugin } from '@vuepress/plugin-search';
import { readdirSync } from 'fs';
import path from 'path';

const commandDocs = readdirSync(path.join(__dirname, '../commands'))
  .filter(item => item.endsWith('.md'))
  .sort()
  .map(item => `/commands/${item}`);

const featureDocs = readdirSync(path.join(__dirname, '../features'))
  .filter(item => item.endsWith('.md'))
  .sort()
  .map(item => `/features/${item}`);

export default defineUserConfig({
  base: '/cli/',
  lang: 'zh-CN',
  title: '@wxcloud/cli',
  description: '微信云服务 CLI 工具使用文档',
  head: [
    [
      'link',
      {
        rel: 'icon',
        href: '/images/logo.svg',
        media: '(prefers-color-scheme:no-preference)'
      }
    ],
    [
      'link',
      {
        rel: 'icon',
        href: '/images/logo-white.svg',
        media: '(prefers-color-scheme:dark)'
      }
    ],
    [
      'link',
      {
        rel: 'icon',
        href: '/images/logo.svg',
        media: '(prefers-color-scheme:light)'
      }
    ]
  ],
  theme: defaultTheme({
    sidebarDepth: 0,
    logo: '/images/logo.svg',
    logoDark: '/images/logo-white.svg',
    lastUpdated: true,
    lastUpdatedText: '最近修改于',
    navbar: [
      {
        text: '使用文档',
        link: '/guide'
      },
      {
        text: '微信云托管',
        link: 'https://cloud.weixin.qq.com/cloudrun',
        target: '_blank'
      }
    ],
    sidebar: [
      {
        text: '使用文档',
        children: [
          {
            text: '概览',
            link: '/guide.html'
          },
          {
            text: '功能介绍',
            children: featureDocs,
          },
          {
            text: '命令',
            children: commandDocs
          }
        ]
      }
    ]
  }),
  plugins: [
    nprogressPlugin(),
    backToTopPlugin(),
    searchPlugin(),
    rightAnchorPlugin({
      name: 'toc',
      showDepth: 2,
      expand: { clickModeDefaultOpen: true, trigger: 'click' }
    })
  ]
});
