
## 1. 简介

HTML（HyperText Markup Language）是一种用于描述网页的标准标记语言。

## 2. 基本语法

### 2.1 标签

HTML 标签是由尖括号包围的关键字，比如 `<html>`、`<body>`、`<p>`。

标签的开始和结束标签，比如 `<html>` 标签的开始标签为 `<html>`，结束标签为 `</html>`。

### 2.2 属性

HTML 属性是 HTML 标签的附加信息，比如：
```html
<img src="images/logo.png" alt="logo">
```

上面的代码中，`src` 属性指定了图片的路径，`alt` 属性指定了图片的替代文本。

### 2.3 注释

HTML 注释以 `<!--` 开始，以 `-->` 结束。

```html
<!-- 这是一段注释 -->
```

### 2.4 实体引用

HTML 实体引用用于表示特殊字符，比如 `&lt;` 表示小于号。

```html
<p>这是一段文字，包含了 &lt; 小于号。</p>
```

## 3. 文档类型

HTML 文档必须以 `<!DOCTYPE html>` 开头。

```html
<!DOCTYPE html>
<html>

</html>
```

## 4. 文档标题

HTML 文档的标题是通过 `<title>` 标签来设置的。

```html
<title>我的第一个 HTML 页面</title>
```

## 5. 文档头部

HTML 文档头部是通过 `<head>` 标签来设置的。

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的第一个 HTML 页面</title>
</head>
```

## 6. 文档主体

HTML 文档主体是通过 `<body>` 标签来设置的。

```html
<body>
  <h1>我的第一个 HTML 页面</h1>
  <p>Hello World!</p>
</body>
```

## 7. 文档结构

HTML 文档的结构由 `<html>`、`<head>`、`<body>` 标签组成。