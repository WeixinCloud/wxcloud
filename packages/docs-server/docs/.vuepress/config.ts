import { defaultTheme, defineUserConfig } from 'vuepress';
import { nprogressPlugin } from '@vuepress/plugin-nprogress';
import { backToTopPlugin } from '@vuepress/plugin-back-to-top';
import { searchPlugin } from '@vuepress/plugin-search';
import { readdirSync } from 'fs';
import path from 'path';

const commandDocs = readdirSync(path.join(__dirname, '..'))
  .filter(item => !item.startsWith('.') && !item.startsWith('README') && item.endsWith('.md'))
  .sort();

export default defineUserConfig({
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
    logo: '/images/logo.svg',
    logoDark: '/images/logo-white.svg',
    lastUpdated: true,
    lastUpdatedText: '最近修改于',
    navbar: [
      {
        text: '使用文档',
        link: ''
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
          '/',
          {
            text: '命令',
            children: commandDocs
          }
        ]
      }
    ]
  }),
  plugins: [nprogressPlugin(), backToTopPlugin(), searchPlugin()]
});
