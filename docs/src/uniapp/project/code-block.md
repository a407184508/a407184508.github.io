
# 代码块汇总

## checkbox iPad点击无效问题: [可能是样式问题]
```css
uni-checkbox .uni-checkbox-input {
    border-radius: 3upx !important;
    color: #ffffff !important;
}

uni-checkbox .uni-checkbox-input.uni-checkbox-input-checked {
    color: #fff;
    border-color: rgb(0, 122, 255);
    background: rgb(0, 122, 255);
}

uni-checkbox .uni-checkbox-input.uni-checkbox-input-checked:after {
    font-size: 18px;
}
```

## 修改当前页面不滚动, 并设置取消 app 的弹簧效果.

```json{7}
{
  "path": "pages/index/index",
  "style": {
    "navigationBarTitleText": "首页",
    "navigationBarBackgroundColor": "#FCFBF7",
    "enablePullDownRefresh": false,
    "disableScroll": true,
    "app-plus": {
      "bounce": "none"
    }
  }
}
```