
# vue

## 1. 介绍

Vue.js 是一套用于构建用户界面的渐进式框架。

Vue 被设计为可以自底向上逐层应用。Vue 的核心库只关注视图层，不仅易于上手，还便于与第三方库或既有项目整合。

## 2. 特点

- 轻量级：核心库只有 10KB，其余功能模块均可根据需要使用
- 响应式：Vue 将视图和数据绑定，当数据变化时，视图会相应更新
- 组件化：Vue 的核心库只关注视图层，不仅易于上手，还便于与第三方库或既有项目整合
- 单文件组件：单文件组件让你专注于业务逻辑，将你的应用拆分为多个小文件，易于维护和升级
- 指令：Vue.js 允许你通过自定义指令来扩展 HTML 元素，添加自定义特性。
- 单向数据流：Vue 的核心库没有提供修改数据的方法，所有的修改数据的方法都集中到指令和计算属性中。

## 3. 核心语法
### 3.1 数据绑定

```html
<div id="app">
  <p>{{ message }}</p>
  <p>{{ message.split('').reverse().join('') }}</p>
</div>
```

```js
var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue.js!'
  }
})
```

### 3.2 计算属性

```html
<div id="app">
  <p>{{ message }}</p>
  <p>{{ reversedMessage }}</p>
</div>
```
```js
var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue.js!'
  },
  computed: {
    reversedMessage: function () {
      return this.message.split('').reverse().join('')
    }
  }
})
```

### 3.3 监听属性

```html
<div id="app">
  <p>{{ message }}</p>
  <button v-on:click="reverseMessage">Reverse Message</button>
</div>
```

```js
var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue.js!'
  },
  methods: {
    reverseMessage: function () {
      this.message = this.message.split('').reverse().join('')
    }
  }
})
```

### 3.4 条件渲染

```html
<div id="app">
  <p v-if="seen">Now you see me</p>
</div>
```

```js
var app = new Vue({
  el: '#app',
  data: {
    seen: true
  }
})
```

### 3.5 列表渲染

```html
<div id="app">
  <ul>
    <li v-for="item in items">
      {{ item.message }}
    </li>
  </ul>
</div>
```

```js
var app = new Vue({
  el: '#app',
  data: {
    items: [
      { message: 'Foo' },
      { message: 'Bar' }
    ]
  }
})
```
### 3.6 事件处理

```html
<div id="app">
  <p>{{ message }}</p>
  <button v-on:click="reverseMessage">Reverse Message</button>
</div>
```

```js
var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue.js!'
  },
  methods: {
    reverseMessage: function () {
      this.message = this.message.split('').reverse().join('')
    }
  }
})
```

### 3.7 表单输入绑定

```html
<div id="app">
  <p>{{ message }}</p>
  <input v-model="message">
</div>
```

```js
var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue.js!'
  }
})
```

### 3.8 组件

```html
<div id="app">
  <my-component></my-component>
</div>
```

```js
Vue.component('my-component', {
  template: '<div>A custom component!</div>'
})

var app = new Vue({
  el: '#app'
})
```

### 3.9 组件间通信

```html
<div id="app">
  <compA></compA>
</div>
```

```js
Vue.component(compA, {
  template: '<div>A custom component!</div>'
})
var app = new Vue({
  el: '#app'
})
```
## 4. 应用场景

### 4.1 构建用户界面

Vue.js 适合构建用户界面，因为它可以轻松地构建可复用的组件，并将它们与数据绑定起来。

### 4.2 构建大型单页应用

Vue.js 适合构建大型单页应用，因为它可以轻松地构建可复用的组件，并将它们与数据绑定起来。

### 4.3 构建后台管理系统

Vue.js 适合构建后台管理系统，因为它可以轻松地构建可复用的组件，并将它们与数据