
## Docker

## 1. 简介

Docker 是一个开源的应用容器引擎，让开发者打包他们的应用以及依赖包到一个可移植的容器中，然后发布到任何流行的 Linux 机器上，也可以实现虚拟化。

Docker 容器是完全使用沙箱机制，相互之间不会有任何接口。更重要的是，容器性能开销极低。

## 2. 安装

### 2.1 安装 Docker

#### 2.1.1 下载安装包

```bash
# 下载安装包
$ wget -qO- https://get.docker.com/ | sh
```

#### 2.1.2 验证安装

```bash
# 查看版本
$ docker version

# 验证是否安装成功
$ docker run hello-world
```

### 2.2 配置 Docker

#### 2.2.1 配置镜像加速器

```bash
# 编辑配置文件
$ sudo vi /etc/docker/daemon.json

# 添加配置
{
  "registry-mirrors": ["https://docker.mirrors.ustc.edu.cn"]
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  }
}
```

#### 2.2.2 配置 Docker 容器运行时

```bash
# 编辑配置文件
$ sudo vi /etc/docker/daemon.json

# 添加配置
{
  "runtimes": {
    "runc": {
      "path": "/usr/bin/runc"
    },
    "nvidia": {
      "path": "/usr/bin/nvidia-container-runtime",
      "runtimeArgs": ["--runtime=nvidia"]
    }
  },
  "default-runtime": "nvidia"
}
```

#### 2.2.3 配置 Docker 容器运行时

```bash
# 编辑配置文件
$ sudo vi /etc/docker/daemon.json

# 添加配置
{
  "runtimes": {
    "runc": {
      "path": "/usr/bin/runc"
    },
    "nvidia": {
      "path": "/usr/bin/nvidia-container-runtime",
      "runtimeArgs": ["--runtime=nvidia"]
    }
  },
  "default-runtime": "nvidia"
}
```

#### 2.2.4 重启 Docker 服务

```bash
# 重启 Docker 服务
$ sudo systemctl restart docker

```

## 3. 常用命令

### 3.1 镜像相关命令

#### 3.1.1 列出本地镜像

```bash
# 列出本地镜像
$ docker images
```

#### 3.1.2 删除镜像

```bash
# 删除镜像
$ docker rmi <image_id>
```

#### 3.1.3 镜像打标签

```bash
# 镜像打标签
$ docker tag <image_id> <tag_name>
```

#### 3.1.4 镜像上传

```bash
# 镜像上传
$ docker push <image_name>
```

### 3.2 容器相关命令

#### 3.2.1 列出本地容器

```bash
# 列出本地容器
$ docker ps -a
```

#### 3.2.2 启动容器

```bash
# 启动容器
$ docker start <container_id>
```

#### 3.2.3 停止容器

```bash
# 停止容器
$ docker stop <container_id>
```

#### 3.2.4 删除容器

```bash
# 删除容器
$ docker rm <container_id>
```

#### 3.2.5 进入容器

```bash
# 进入容器
$ docker exec -it <container_id> /bin/bash
```

#### 3.2.6 导出容器

```bash
# 导出容器
$ docker export <container_id> > <container_name>.tar
```

#### 3.2.7 导入容器

```bash
# 导入容器
$ docker import <container_name>.tar
```

#### 3.2.8 容器重命名

```bash
# 容器重命名
$ docker rename <old_name> <new_name>
## 4. 常见问题

### 4.1 如何查看 Docker 版本

```bash
# 查看 Docker 版本
$ docker version
```

### 4.2 如何查看 Docker 镜像

```bash
# 列出本地镜像
$ docker images
```

### 4.3 如何删除 Docker 镜像

```bash
# 删除镜像
$ docker rmi <image_id>
```

### 4.4 如何上传 Docker 镜像

```bash
# 镜像上传
$ docker push <image_name>
```

### 4.5 如何启动 Docker 容器

```bash
# 启动容器
$ docker start <container_id>
```

### 4.6 如何停止 Docker 容器

```bash
# 停止容器
$ docker stop <container_id>
```

### 4.7 如何删除 Docker 容器

```bash
# 删除容器
$ docker rm <container_id>
```

### 4.8 如何进入 Docker 容器

```bash
# 进入容器
$ docker exec -it <container_id> /bin/bash
### 4.9 如何导出 Docker 容器

```bash
# 导出容器
$ docker export <container_id> > <container_name>.tar
```

### 4.10 如何导入 Docker 容器

```bash
# 导入容器
$ docker import <container_name>.tar
```

### 4.11 如何重命名 Docker 容器

```bash
# 容器重命名
$ docker rename <old_name> <new_name>
```

### 4.12 如何查看 Docker 容器
```bash
# 列出本地容器
$ docker ps -a
```

