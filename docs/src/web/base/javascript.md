
# JavaScript 
## 1. JavaScript 介绍

JavaScript 是一种动态类型、弱类型、基于原型的语言，内置支持类型。

## 2. JavaScript 语法

### 2.1 变量

```javascript
// 变量声明
var a = 1;
var b = 2;

// 变量赋值
a = 3;
b = 4;

// 变量类型
var c = 'hello';
var d = 123;
var e = true;
var f = null;
var g = undefined;
// 变量声明
var a;
var b;

// 变量赋值
a = 3;
b = 4;

// 变量类型
var c = 'hello';
var d = 123;
var e = true;
var f = null;
var g = undefined;
```

### 2.2 常量

```javascript
// 常量声明
const PI = 3.14;
const MAX_VALUE = 1000;

// 常量赋值
PI = 3.1415;
MAX_VALUE = 10000;
```

### 2.3 数据类型

```javascript
// 数字
var a = 1;
var b = 1.2;
var c = 0.1 + 0.2;

// 字符串
var d = 'hello';
var e = "world";
var f = '你好';
var g = "你好";

// 布尔
var h = true;
var i = false;

// 数组
var j = [1, 2, 3];
var k = [1, 2, 3, 'hello', 'world'];
// 数组元素类型可以不一致
var l = [1, 2, 3, 'hello', true];

// 对象
var m = {
    name: 'hello',
    age: 123
};
var n = {
    name: 'world',
    age: 456
};

// 函数
function func(a, b) {
    return a + b;
}
```

### 2.4 运算符

```javascript
// 算术运算符
var a = 1;
var b = 2;
var c = a + b;
var d = a - b;
var e = a * b;
var f = a / b;
var g = a % b;

// 赋值运算符
var a = 1;
var b = 2;
a += b;
a -= b;
a *= b;
a /= b;
a %= b;

// 比较运算符
var a = 1;
var b = 2;
var c = a == b;
var d = a!= b;
var e = a > b;
var f = a < b;
```

