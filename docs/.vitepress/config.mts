import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Mr.Chen",
  description: "个人博客",
  srcDir: "./src",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    // 配置导航
    nav: [
      { text: 'Home', link: '/' },
      { text: 'roadmap', link: '/roadmap' },
      { text: 'about', link: '/about' },
      {
        text: 'Dropdown Menu',
        items: [
          { text: 'Item A', link: '/item-1' },
          { text: 'Item B', link: '/item-2' },
          { text: 'Item C', link: '/item-3' }
        ]
      }
    ],
    // 配置侧边栏
    sidebar: [
      {
        text: '项目根目录',
        items: [
          { text: 'uniapp', link: '/uniapp/index' },
          { text: 'vitepress', link: '/vitepress/index' },
          { text: 'macos', link: '/mac/index' },
          { text: 'ios', link: '/ios/index' },
          { text: 'flutter', link: '/flutter/index' },
          { text: 'project', link: '/project/index' },
          { text: 'web', link: '/web/index' },
          { text: 'server', link: '/server/index' },
          { text: 'android', link: '/android/index' },
        ],
        collapsed: false
      }
    ],
    // 配置社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
      { icon: 'twitter', link: '...' },
      // You can also add custom icons by passing SVG as string:
      {
        icon: {
          svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Dribbble</title><path d="M12...6.38z"/></svg>'
        },
        link: '...',
        // You can include a custom label for accessibility too (optional but recommended):
        ariaLabel: 'cool link'
      }
    ],

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
    returnToTopLabel: 'top'
  },

  rewrites: {

  },

})
