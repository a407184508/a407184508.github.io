
# node 链接 MySQL

在 Node.js 中，你可以使用 `mysql` 这个模块来连接 MySQL 数据库。

## 安装 mysql 模块

```bash
npm install mysql
```

## 连接数据库

你可以使用 `createConnection()` 方法来连接数据库。

```js
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'your_database_user',
  password : 'your_database_password',
  database : 'your_database_name'
});

connection.connect();
```

## 执行查询

你可以使用 `query()` 方法来执行查询。

```js
connection.query('SELECT * FROM users', function(err, rows, fields) {
  // connected! (unless `err` is set)
  // `rows` is an array of rows returned by the query
  // `fields` is an array of fields returned by the query
});
```

## 关闭连接

当你完成了数据库操作后，你需要关闭连接。

```js
connection.end();
```

## 错误处理

当你执行查询时，如果发生错误，会触发 `error` 事件。

```js
connection.on('error', function(err) {
  // error handler
});
```

## 事务

你可以使用 `connection.beginTransaction()` 方法来开始事务。

```js
connection.beginTransaction(function(err) {
  if (err) {
    // error handler
  }

  // your queries here

  connection.commit(function(err) {
    if (err) {
      // error handler
    }
  });
});
```

## 事件

MySQL 模块支持以下事件：

- `error` - 当发生错误时触发
- `connect` - 当连接成功时触发
- `end` - 当连接关闭时触发

## 连接池

你可以使用 `mysql.createPool()` 方法来创建连接池。

```js
var mysql = require('mysql');

var pool = mysql.createPool({
  host     : 'localhost',
  user     : 'your_database_user',
  password : 'your_database_password',
  database : 'your_database_name'
});

pool.getConnection(function(err, connection) {
  // connected! (unless `err` is set)
  // use the `connection`
});
```

## 连接池事件

连接池支持以下事件：
- `connection` - 当连接池创建新连接时触发
- `enqueue` - 当连接池达到最大连接数时触发
- `release` - 当连接被释放时触发
- `acquire` - 当连接被获取时触发
- `destroy` - 当连接池被销毁时触发

## 连接池方法

连接池支持以下方法：
- `getConnection()` - 获取一个连接
- `releaseConnection(connection)` - 释放一个连接
- `destroy()` - 销毁连接池

## 连接池配置

你可以使用 `createPool()` 方法来配置连接池。

```js
var mysql = require('mysql');

var pool = mysql.createPool({
  host     : 'localhost',
  user     : 'your_database_user',
  password : 'your_database_password',
  database : 'your_database_name',
  connectionLimit : 10,
  queueLimit : 0
});
```

- `host` - 数据库主机名
- `user` - 数据库用户名
- `password` - 数据库密码
- `database` - 数据库名称
- `port` - 数据库端口
- `socketPath` - 数据库的 Unix 套接字
- `charset` - 数据库的字符集
- `timezone` - 数据库的时区
- `connectTimeout` - 连接超时时间
- `acquireTimeout` - 获取连接超时时间
- `waitForConnections` - 是否等待连接
- `connectionLimit` - 最大连接数
- `queueLimit` - 最大等待队列数

## 连接池属性

连接池支持以下属性：
- `config` - 连接池配置
- `totalConnections` - 连接池中总的连接数
- `freeConnections` - 连接池中空闲的连接数
- `waitingClients` - 等待连接的客户端数
- `running` - 是否正在运行
- `connectionError` - 连接错误
- `queue` - 等待连接的队列

## 连接池方法

连接池支持以下方法：
- `getConnection()` - 获取一个连接
- `releaseConnection(connection)` - 释放一个连接

