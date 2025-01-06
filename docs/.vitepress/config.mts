import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: "MR.CHEN",
  description: "个人博客",
  srcDir: "./src",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    // 配置logo
    logo: '/static/logo2.png',

    // 配置站点标题
    siteTitle: 'MR.CHEN',

    // 配置导航
    nav: [
      { text: '首页', link: '/' },
      { text: '知识地图', link: '/roadmap' },
      { text: '关于', link: '/about' },
      // {
      //   text: 'Dropdown Menu',
      //   items: [
      //     { text: 'Item A', link: '/item-1' },
      //     { text: 'Item B', link: '/item-2' },
      //     { text: 'Item C', link: '/item-3' }
      //   ]
      // }
    ],
    // 配置侧边栏
    sidebar: [
      {
        text: 'iOS 开发',
        items: [
          { text: '环境搭建', link: '/ios/index' },
          { text: 'Swift', link: '/ios/swift' },
          { text: 'SwiftUI', link: '/ios/swiftui' },
          { text: '速查', link: '/ios/quick' },
        ],
        collapsed: false
      },
      {
        text: "Java",
        items: [
          { text: 'JavaScript', link: '/javascript/index' },
          { text: 'TypeScript', link: '/typescript/index' },
          { text: 'Node.js', link: '/node/index' },
          { text: 'Vue.js', link: '/vue/index' },
          { text: 'React.js', link: '/react/index' },
          { text: 'Webpack', link: '/webpack/index' },
        ]
      },
      {
        text: "Web 开发",
        items: [
          { text: 'Web', link: '/web/index' },
          { text: 'Vue', link: '/vue/index' },
          { text: 'React', link: '/react/index' },
          { text: 'Node', link: '/node/index' },
          { text: 'Project', link: '/project/index' },
          { text: 'Server', link: '/server/index' },
        ]
      },
      {
        text: "VitePress",
        items: [
          { text: 'VitePress', link: '/vitepress/index' },
        ]
      }
    ],

    // 配置社交链接
    // socialLinks: [
    //   { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
    //   { icon: 'twitter', link: '...' },
    //   // You can also add custom icons by passing SVG as string:
    //   {
    //     icon: {
    //       svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Dribbble</title><path d="M12...6.38z"/></svg>'
    //     },
    //     link: '...',
    //     // You can include a custom label for accessibility too (optional but recommended):
    //     ariaLabel: 'cool link'
    //   }
    // ],

    // 文档页脚
    docFooter: {
      prev: 'Pagina prior',
      next: 'Proxima pagina'
    },

    // 配置页脚
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 Mr.chen'
    },

    // 编辑链接
    editLink: {
      pattern: 'https://github.com/vuejs/vitepress/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    // 最后更新时间
    lastUpdated: {
      text: '最后更新时间',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },

    // 是否现在返回顶部按钮
    returnToTopLabel: 'top',

    externalLinkIcon: true,
  },

  // 路由重写
  rewrites: {

  },

})
