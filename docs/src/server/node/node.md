
# node

## 1. 简介

Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时，用于在服务器上运行 JavaScript 代码。

Node.js 是一个事件驱动、非阻塞式 I/O 的 JavaScript 运行时，其本身是一个事件驱动的程序，使用 libuv 作为其事件循环。

Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时，用于在服务器上运行 JavaScript 代码。

Node.js 是一个事件驱动、非阻塞式 I/O 的 JavaScript 运行时，其本身是一个事件驱动的程序，使用

## 2. 安装

```bash
# 下载安装包
$ wget https://nodejs.org/dist/v12.16.1/node-v12.16.1-linux-x64.tar.xz

# 解压安装包
$ tar -xvf node-v12.16.1-linux-x64.tar.xz

# 移动到指定目录
$ mv node-v12.16.1-linux-x64 /usr/local/node

# 切换到指定目录
$ cd /usr/local/node

# 给当前用户添加执行权限
$ chmod +x./bin/node

# 给当前用户添加执行权限
$ chmod +x./bin/npm

# 查看版本
$./bin/node -v
v12.16.1

# 查看npm版本
$./bin/npm -v
6.13.4
```

## 3. 常用命令

```bash
# 启动服务
$ node app.js

# 停止服务
$ node app.js stop

# 重启服务
$ node app.js restart

# 查看服务状态
$ node app.js status

# 重载服务
$ node app.js reload

# 打印帮助信息
$ node app.js help
```

## 4. 常用模块

```bash
# 日志模块
$ npm install winston

# 数据库模块
$ npm install mongoose

# 缓存模块
$ npm install redis

# 邮件模块
$ npm install nodemailer

# 图片处理模块
$ npm install gm

# 上传模块
$ npm install multer

# 表单验证模块
$ npm install express-validator

# 加密模块
$ npm install bcryptjs

# 身份验证模块
$ npm install passport

# 身份验证模块
$ npm install passport-local

# 身份验证模块
$ npm install passport-local-mongoose

# 身份验证模块
$ npm install passport-jwt

# 身份验证模块
$ npm install passport-jwt-mongoose

# 身份验证模块
$ npm install passport-facebook

# 身份验证模块

$ npm install passport-google-oauth20

# 身份验证模块
$ npm install passport-linkedin-oauth2

# 身份验证模块
$ npm install passport-github

# 身份验证模块
$ npm install passport-twitter

# 身份验证模块
$ npm install passport-weixin

# 身份验证模块
$ npm install passport-weibo

# 身份验证模块
$ npm install passport-tumblr

# 身份验证模块
$ npm install passport-instagram

# 身份验证模块
$ npm install passport-bitbucket

# 身份验证模块
$ npm install passport-dropbox

# 身份验证模块
$ npm install passport-vkontakte

# 身份验证模块
$ npm install passport-yandex

# 身份验证模块
$ npm install passport-auth0

# 身份验证模块
$ npm install passport-bitbucket-oauth

# 身份验证模块
$ npm install passport-foursquare

# 身份验证模块
$ npm install passport-meetup

# 身份验证模块
$ npm install passport-uber

# 身份验证模块
$ npm install passport-dailymotion

```

## 5. 常用配置

```bash
# 日志配置
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

# 数据库配置
const mongoose = require('mongoose');
mongoose.connect(, { useNewUrlParser: true, useUnifiedTopology: true });

# 缓存配置
const redis = require('redis');
const client = redis.createClient();

# 邮件配置
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'qq',
  auth: {
    user: 'xxx',
    pass: 'xxx'
  }
  // secure: true, // use SSL
  // tls: {
  //   rejectUnauthorized: false
  // }
});
```

## 6. 常用方法

```bash
# 日志方法
logger.log('info', 'Hello world');

# 数据库方法
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  password: String
}));

User.find({ name: 'tobi' }, (err, docs) => {
  if (err) return handleError(err);
  console.log(docs);
});

# 缓存方法
client.set('foo', 'bar', redis.print);
client.get('foo', redis.print);
# 邮件方法
transporter.sendMail({
  from:,
  to:,
  subject: 'Hello world',
  text: 'Hello world?'
}, (err, info) => {
  if (err) return console.log(err);
  console.log(info);
});

# 图片处理方法
gm(src).resize(200, 200).write(dest, (err) => {
  if (err) return console.log(err);
  console.log('done');
});

# 上传方法
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
app.post('/profile', upload.single('avatar'), (req, res) => {
  console.log(req.file);
  console.log(req.body);
  res.end();
});
# 表单验证方法
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const validator = require('express-validator');
app.use(bodyParser.json());
app.use(validator());
app.post('/profile', (req, res) => {
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('password', 'Password is required').notEmpty();
}

```