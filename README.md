# vitepress 构建的文档站点

## 运行环境

- node 14+
- pnpm 6+
- github pages

## vitepress 命令:

```bash
"scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
}
```

## 安装

```bash
pnpm install
```

## 部署

```bash
pnpm deploy
```

## 注意

- 部署之前请先修改 `config.js` 中的 `base` 字段为你的网站地址
- 部署之前请先修改 `config.js` 中的 `repo` 字段为你的仓库地址
- 部署之前请先修改 `config.js` 中的 `branch` 字段为你的分支名
- 部署之前请先修改 `config.js` 中的 `cname` 字段为你的网站域名