import { defaultTheme, defineUserConfig } from 'vuepress';
import { viteBundler } from '@vuepress/bundler-vite';
import { nprogressPlugin } from '@vuepress/plugin-nprogress';
import { backToTopPlugin } from '@vuepress/plugin-back-to-top';
import { rightAnchorPlugin } from 'vuepress-plugin-right-anchor';
import { registerComponentsPlugin } from '@vuepress/plugin-register-components';
import { searchPlugin } from '@vuepress/plugin-search';
import { readdirSync } from 'fs';
import WindiCSS from 'vite-plugin-windicss'
import path from 'path';

const docs = ['commands', 'features', 'terminology'].map(category =>
  readdirSync(path.join(__dirname, `../${category}`))
    .filter(item => item.endsWith('.md'))
    .sort()
    .map(item => `/${category}/${item}`)
);

export default defineUserConfig({
  base: '/cli/',
  lang: 'zh-CN',
  title: '微信云托管 CLI',
  description: '微信云托管 CLI 工具使用文档',
  bundler: viteBundler({
    viteOptions: {
      plugins: [
        // Unocss({
        //   shortcuts: [
        //     {
        //       'framework-card':
        //         'bg-#FFFFFF3B rounded-12px border border-1 border-#FFFFFFCE px-64px py-8px grid place-items-center',
        //       'primary-button': 'bg-#07C160 px-84px py-20px color-white w-max rounded-8px cursor-pointer'
        //     }
        //   ],
        //   presets: [presetWind()]
        // })
        WindiCSS({
          root: 'docs/.vuepress',
        })
      ]
    }
  }),
  head: [
    [
      'link',
      {
        rel: 'icon',
        href: '/cli/images/logo.svg',
        media: '(prefers-color-scheme:no-preference)'
      }
    ],
    [
      'link',
      {
        rel: 'icon',
        href: '/cli/images/logo-white.svg',
        media: '(prefers-color-scheme:dark)'
      }
    ],
    [
      'link',
      {
        rel: 'icon',
        href: '/cli/images/logo.svg',
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
    contributors: false,
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
            text: '快速上手',
            link: '/basics.html'
          },
          {
            text: '功能介绍',
            children: docs[1]
          },
          {
            text: '命令',
            children: docs[0]
          },
          {
            text: '原理',
            children: docs[2]
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
    }),
    registerComponentsPlugin({
      componentsDir: path.resolve(__dirname, './components')
    })
  ]
});
