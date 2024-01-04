
# brew 配置

## 1. 安装brew

```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

## 2. 常用命令

```bash
# 查看brew版本
brew --version

# 查看brew帮助
brew help

# 查看brew命令
brew commands

# 查看brew安装目录
brew --prefix

# 查看brew安装目录下的bin目录
brew --prefix bin

# 查看brew安装目录下的Cellar目录
brew --prefix cellar

```

## 3. 安装软件

```bash
# 安装软件
brew install <formula>

# 卸载软件
brew uninstall <formula>

# 更新软件
brew update

# 更新指定软件
brew upgrade <formula>

# 查看软件信息
brew info <formula>

# 查看软件的依赖
brew deps <formula>

# 查看软件的依赖
brew leaves <formula>

# 查看软件的依赖
brew uses <formula>

# 查看软件的依赖
brew linkage <formula>

# 查看软件的依赖
brew doctor

# 查看软件的依赖
brew missing

# 查看软件的依赖
brew list

# 查看软件的依赖
brew list --versions

# 查看软件的依赖
brew list --unbrewed

# 查看软件的依赖
brew list --pinned

# 查看软件的依赖
brew list --versions --unbrewed

# 查看软件的依赖
brew list --pinned --unbrewed

# 查看软件的依赖
brew list --versions --pinned --unbrewed

# 查看软件的依赖
brew list --versions --pinned

```

## 4. 服务器

```bash
# 安装nginx
brew install nginx

# 启动nginx
brew services start nginx

# 停止nginx
brew services stop nginx

# 重启nginx
brew services restart nginx

# 重载nginx
brew services reload nginx

# 显示nginx状态
brew services list

# 显示nginx状态
brew services list | grep nginx

# 显示nginx状态
brew services list | grep nginx | awk '{print }'

```

## 5. 其他

```bash
# 显示brew命令
brew --prefix

# 显示brew命令
brew --prefix bin

# 显示brew命令
brew --prefix cellar

# 显示brew命令
brew --prefix etc

# 显示brew命令
brew --prefix include

# 显示brew命令
brew --prefix lib

# 显示brew命令
brew --prefix share

# 显示brew命令
brew --prefix var

# 显示brew命令
brew --prefix opt

# 显示brew命令
brew --prefix man
```

## 6. 参考

- [Homebrew - The missing package manager for macOS](https://brew.sh/)
- [Homebrew - Homebrew/homebrew-core](https://github.com/Homebrew/homebrew-core)
- [Homebrew - Homebrew/homebrew-cask](https://github.com/Homebrew/homebrew-cask)
- [Homebrew - Homebrew/homebrew-bundle](https://github.com/Homebrew/homebrew-bundle)
- [Homebrew - Homebrew/homebrew-services](https://github.com/Homebrew/homebrew-services)
- [Homebrew - Homebrew/homebrew-cask-drivers]()