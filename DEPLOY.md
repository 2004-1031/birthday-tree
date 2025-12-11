# 部署指南

本指南将帮助您将项目上传到 GitHub 并部署到 GitHub Pages，让其他人可以访问您的网站。

## 📋 前置要求

1. 已安装 Git
2. 已安装 Node.js 和 npm
3. 拥有 GitHub 账号

## 🚀 步骤 1: 创建 GitHub 仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: 输入仓库名称（例如：`birthday-tree`）
   - **Description**: 可选，填写项目描述
   - **Visibility**: 选择 Public（公开）或 Private（私有）
   - ⚠️ **不要**勾选 "Initialize this repository with a README"（因为本地已有代码）
4. 点击 "Create repository"

## 📤 步骤 2: 上传代码到 GitHub

在项目根目录打开终端，执行以下命令：

```bash
# 1. 初始化 Git 仓库（如果还没有初始化）
git init

# 2. 添加所有文件到暂存区
git add .

# 3. 提交代码
git commit -m "Initial commit: Birthday tree project"

# 4. 添加远程仓库（将 YOUR_USERNAME 和 YOUR_REPO_NAME 替换为你的实际信息）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 5. 推送到 GitHub
git branch -M main
git push -u origin main
```

**示例**：
如果您的 GitHub 用户名是 `john`，仓库名是 `birthday-tree`，则命令为：
```bash
git remote add origin https://github.com/john/birthday-tree.git
```

## 🌐 步骤 3: 启用 GitHub Pages

### 方法 1: 使用 GitHub Actions（推荐，已自动配置）

1. 进入您的 GitHub 仓库页面
2. 点击 "Settings"（设置）标签
3. 在左侧菜单中找到 "Pages"
4. 在 "Source" 部分，选择 "GitHub Actions"
5. 保存设置

### 方法 2: 手动部署

如果不想使用 GitHub Actions，可以手动部署：

1. 在本地构建项目：
   ```bash
   npm run build
   ```

2. 进入 `dist` 目录，初始化 Git 并推送到 `gh-pages` 分支：
   ```bash
   cd dist
   git init
   git add .
   git commit -m "Deploy to GitHub Pages"
   git branch -M gh-pages
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin gh-pages
   ```

3. 在 GitHub 仓库设置中，将 Pages 源设置为 `gh-pages` 分支

## ⚙️ 步骤 4: 配置仓库名称（如果需要）

如果您的仓库名称**不是**根路径（例如：`https://username.github.io/repo-name/`），需要更新 `vite.config.ts`：

```typescript
export default defineConfig({
  // ... 其他配置
  base: '/your-repo-name/',  // 替换为您的实际仓库名
})
```

如果您的仓库是 `username.github.io`（个人主页），则保持 `base: './'` 即可。

## ✅ 步骤 5: 访问您的网站

部署完成后（通常需要几分钟），您的网站将在以下地址可用：

- **如果仓库名是 `username.github.io`**: `https://username.github.io`
- **如果仓库名是其他名称**: `https://username.github.io/repo-name/`

您可以在仓库的 Settings > Pages 页面查看部署状态和 URL。

## 🔄 自动部署

配置完成后，每次您推送代码到 `main` 或 `master` 分支时，GitHub Actions 会自动：
1. 构建项目
2. 部署到 GitHub Pages

您可以在仓库的 "Actions" 标签页查看部署进度。

## 🛠️ 故障排除

### 问题 1: 页面显示 404
- 检查 GitHub Pages 设置是否正确
- 确认 `vite.config.ts` 中的 `base` 配置是否正确
- 等待几分钟让部署完成

### 问题 2: 资源加载失败
- 检查浏览器控制台的错误信息
- 确认 `base` 路径配置正确
- 尝试清除浏览器缓存

### 问题 3: GitHub Actions 部署失败
- 检查 Actions 标签页中的错误日志
- 确认 `package.json` 中的构建脚本正确
- 确认所有依赖都已正确安装

## 🌟 其他部署选项

除了 GitHub Pages，您还可以使用以下平台：

### Vercel（推荐，最简单）
1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 导入您的仓库
4. 点击 "Deploy"，自动完成

### Netlify
1. 访问 [netlify.com](https://netlify.com)
2. 使用 GitHub 账号登录
3. 选择 "Add new site" > "Import an existing project"
4. 选择您的仓库并部署

### Cloudflare Pages
1. 访问 [pages.cloudflare.com](https://pages.cloudflare.com)
2. 连接 GitHub 账号
3. 选择仓库并部署

这些平台通常提供：
- 自动 HTTPS
- 全球 CDN
- 自定义域名支持
- 自动部署（推送代码时自动更新）

## 📝 注意事项

1. **公开仓库**: 如果选择 Public 仓库，代码将对所有人可见
2. **私有仓库**: Private 仓库也可以使用 GitHub Pages，但需要 GitHub Pro 账号
3. **构建时间**: 首次部署可能需要几分钟，后续部署通常更快
4. **文件大小**: 确保上传的文件不超过 GitHub 的限制（单个文件 100MB）

## 🎉 完成！

现在您的网站已经部署完成，可以分享给其他人访问了！

