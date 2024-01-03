# 发布GitHub Pages \ Actions 自动部署

## 1. 准备工作

- 注册GitHub账号
- 克隆项目到本地

## 2. 本地设置 git

```shell
 git init
 touch .gitignore
 git add.
 git commit -m "first commit"
 git remote add origin [<your-github-repo-url>]
 git push -u origin master
```

## 3. 发布GitHub Pages

- 打开GitHub项目，点击Settings按钮，在GitHub Pages中选择master分支，点击Save按钮
- 访问`<your-github-username>.github.io/<your-github-repo-name>`

## 4. 发布后修改

```shell
#  本地修改代码，git add.
 git commit -m "modify"
 git push
```

## tips:

1. 没有读写权限, 在设置里配置 read and write 需要配置读写权限.
2. 在 github pages 里需要设置执行 GitHub Actions, 执行工作流.