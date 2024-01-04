
# Tomcat

## 1. 简介

Tomcat 是 Apache 软件基金会下的一个开放源代码的 Web 应用服务器，用 Java 编写，并遵从 Servlet 和 JSP 规范。

Tomcat 是一个免费的开放源代码的 Web 服务器，由 Apache Software Foundation 开发并维护。

Tomcat 实现了 Java Servlet 和 JavaServer Pages(JSP) 规范，并提供一个 JSP 编译器和运行时环境，它是免费的，并且是开放源代码的。

Tomcat 是一个 Java Servlet 容器，提供了一个 HTTP Web 服务器，可以运行

## 2. 特性

- 多线程处理请求
- 多进程处理请求
- 支持 Servlet 3.0
- 支持 JSP 2.0
- 支持 JMX
- 支持 SSL
- 支持 JAAS
- 支持 JMX
- 支持 JNDI

## 3. 架构

Tomcat 架构如下：

![tomcat-architecture](https://raw.githubusercontent.com/houbb/resource/master/img/web/tomcat/tomcat-architecture.png)

Tomcat 包含以下组件：

- **Engine** ： 引擎，负责管理所有的组件，包括线程池，连接器，请求处理器等。
- **Host** ： 主机，一个或多个虚拟主机，一个主机可以包含多个虚拟目录。
- **Context** ： 虚拟目录，一个虚拟目录对应一个 Web 应用。

## 4. 启动

启动方式：

- 直接运行 `catalina.sh` 或者 `catalina.bat` 脚本
- 运行 `catalina.sh start` 或者 `catalina.bat start`

## 5. 停止

停止方式：

- 直接运行 `catalina.sh` 或者 `catalina.bat` 脚本
- 运行 `catalina.sh stop` 或者 `catalina.bat stop`

## 6. 常用命令

- `catalina.sh start|stop|restart`
- `catalina.sh configtest`

## 7. 常见问题

- 启动报错：`Error: Could not find or load main class org.apache.catalina.startup.Bootstrap`

原因：

- 可能是 tomcat 版本不对，需要使用对应版本的 tomcat 启动脚本。

- 可能是 tomcat 路径不对，需要设置环境变量 `CATALINA_HOME` 或者 `CATALINA_BASE`。

- 可能是 tomcat 启动时没有设置 JAVA_HOME，需要设置环境变量 `JAVA_HOME`。

- 可能是 tomcat 启动时没有设置 CLASSPATH，需要设置环境变量 `

解决方案：

- 确保 tomcat 版本正确，使用对应版本的 tomcat 启动脚本。

- 确保 tomcat 路径正确，设置环境变量 `CATALINA_HOME` 或者 `CATALINA_BASE`。

- 确保 tomcat 启动时设置了 JAVA_HOME，设置环境变量 `JAVA_HOME`。

- 确保 tomcat 启动时设置了 CLASSPATH，设置环境变量 `CLASSPATH`。

- 确保 tomcat 启动时设置了 CATALINA_OPTS，设置环境变量 `CATALINA_OPTS`。

- 确保 tomcat 启动时设置了 JRE_HOME，设置环境变量 `JRE_HOME`。

