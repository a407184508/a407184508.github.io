
# UniApp 开发规范

## 1. 项目结构:

```shell
├── app.js
├── app.json
├── app.wxss
├── components
│   ├── component-a
│   │   ├── component-a.js
│   │   ├── component-a.json
│   │   └── component-a.wxss
│   └── component-b
│       ├── component-b.js
│       ├── component-b.json
│       └── component-b.wxss
├── pages
│   ├── page-a
│   │   ├── page-a.js
│   │   ├── page-a.json
```

## 2. 生命周期:

1. onLoad
2. onShow
3. onHide
4. onUnload
5. onPullDownRefresh
6. onReachBottom
7. onShareAppMessage
8. onPageScroll
9. onResize
10. onTabItemTap

## 3. 代码规范:

1. 一定要使用官方定义的组件标签，不要使用Html 标签.
2. 组件的样式尽尽量使用 scss + scoped 样式 避免污染全局样式.
3. 布局尽量都使用 rpx 防止在不同的设备的样式问题.