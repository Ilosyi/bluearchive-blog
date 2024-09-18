import { defineConfigWithTheme } from 'vitepress'
import mdItCustomAttrs from 'markdown-it-custom-attrs'
import MarkdownIt from 'markdown-it'
import anchorPlugin from 'markdown-it-anchor'

export interface ThemeConfig {
  //navBar
  menuList: { name: string; url: string }[]

  //banner
  videoBanner: boolean
  name: string
  welcomeText: string
  motto: string[]
 social: { icon: string; url: string }[]

  //footer
  footerName: string
  poweredList: { name: string; url: string }[]

  //gitalk
  clientID: string
  clientSecret: string
  repo: string
  owner: string
  admin: string[]

  sidebar: {
    homeLink: { name: string; url: string }, // Link to homepage
    showTableOfContents: boolean, // Option to show the table of contents
  }
}

export default defineConfigWithTheme<ThemeConfig>({
  lang: 'zh-CN',
  head: [
    ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],// 网站图标
    // gitalk
    ['link', { rel: 'stylesheet', href: 'https://unpkg.com/gitalk/dist/gitalk.css' }],// gitalk样式
    ['script', { src: 'https://unpkg.com/gitalk/dist/gitalk.min.js' }],// gitalk脚本
    // bluearchive font
    [
      'link',
      {
        rel: 'stylesheet',// 引入字体
        href: '/font/Blueaka/Blueaka.css',// 字体路径
      },
    ],
    [
      'link',
      {
        rel: 'stylesheet',// 引入字体
        href: '/font/Blueaka_Bold/Blueaka_Bold.css',// 字体路径
      },
    ],
    // 图片灯箱
    [
      'link',
      {
        rel: 'stylesheet',// 引入图片灯箱样式
        href: 'https://cdn.jsdelivr.net/npm/@fancyapps/ui/dist/fancybox.css',// 图片灯箱样式路径
      },
    ],
    [
      'script',// 引入图片灯箱脚本
      {
        src: 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@4.0/dist/fancybox.umd.js',
      },
    ],
  ],
  ignoreDeadLinks: true,
  // 生成站点地图
  // sitemap: {
  //   hostname: 'https://vitepress-theme-bluearchive.vercel.app',
  // },
  title: "Sensei's losyi",// 网站标题
  description: "Sensei's losyi",// 网站描述

  themeConfig: {
    //navBar配置
    menuList: [
      { name: '首页', url: '' },
      { name: '标签', url: 'tags/' },
    ],

    //横幅配置
    videoBanner: false,
    name: "Sensei's losyi",
    welcomeText: 'Hello, Sensei',
    motto: ['和你的日常，就是奇迹', '何気ない日常で、ほんの少しの奇跡を見つける物語。'],
    social: [
      { icon: 'github', url: 'https://github.com/Ilosyi' },
      { icon: 'bilibili', url: 'https://space.bilibili.com/23527984?spm_id_from=333.788.0.0' },
      { icon: 'qq', url: 'https://im.qq.com/index/' },
      { icon: 'wechat', url: 'https://weixin.qq.com/' },
    ],

    //页脚配置
    footerName: 'Sensei',
    poweredList: [
      { name: 'VitePress', url: 'https://github.com/vuejs/vitepress' },
      { name: 'GitHub Pages', url: 'https://docs.github.com/zh/pages' },
    ],

    //gitalk配置
    clientID: 'Ov23lia9U9wFN3WMyoKK',
    clientSecret: 'b2418ab598c188c43a247c99e728dd2735d58c3b',
    repo: 'bluearchive-blog',
    owner: 'losyi',
    admin: ['losyi'],
    
    sidebar: {
    homeLink: { name: '返回主页', url: '/' }, // Set link to homepage
    showTableOfContents: true, // Enable table of contents
  }
  },
  markdown: {
    theme: 'github-light',
    lineNumbers: true,
    math: true,
    config: (md) => {
      // 添加自定义属性
      md.use(mdItCustomAttrs, 'image', {
        'data-fancybox': 'gallery',
      });
     md.use(anchorPlugin, {
        permalink: true,
        permalinkBefore: true,
        permalinkSymbol: '#',
        level: [1, 2, 3,4],
      })
    },
  },
})
