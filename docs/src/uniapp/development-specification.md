
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

页面生命周期钩子:

1. onLoad // 页面加载时触发
2. onShow // 页面显示时触发
3. onHide // 页面隐藏时触发
4. onUnload
5. onPullDownRefresh
6. onReachBottom
7. onShareAppMessage
8. onPageScroll
9. onResize
10. onTabItemTap

组件生命周期钩子:

## 3. 代码规范:

1. 一定要使用官方定义的组件标签，不要使用Html 标签.
2. 组件的样式尽尽量使用 scss + scoped 样式 避免污染全局样式.
3. 布局尽量都使用 rpx 防止在不同的设备的样式问题.
4. 尽量使用强类型数据类型, 在 app 上会有兼容性问题.
5. 使用 js 的字典属性的时候, 尽量把每一个数据类型都列举出来.
6. 用基本类型来确定数据: String\Number\Boolean\等.
7. 尽量少使用或者不使用 Null 类型的数据.
8. 在不同的平台使用预编译宏: `//ifdef MP-WEIXIN` 或者 `//ifdef APP` 来进行处理.
9. 使用驼峰,小驼峰, 来命名变量, 函数, 类, 组件等.
