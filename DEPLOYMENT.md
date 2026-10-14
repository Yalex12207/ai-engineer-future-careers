# AI Engineer — GitHub Pages 在线作品

项目是 React + TypeScript + Vite + GSAP 实时交互网站，没有路径路由或服务器端业务。五幕、16:9 横屏布局、动画、交互、讲解提示、全屏与 PRESENTED BY / Yalex / Computer H262 保持原样。

## 路径与静态资源

生产构建和本地生产预览使用 `/ai-engineer-future-careers/`。本地开发继续使用 `/`，保留 Playwright + FFmpeg 的本地视频导出接口与已有命令。

首页链接使用 `import.meta.env.BASE_URL`；HTML 图标和字体预加载使用 `%BASE_URL%`。Vite 为 CSS 字体地址及 JS/CSS 自动加上生产 base 前缀。字体与 SVG 均在项目内，不依赖外部 CDN。五幕是同一页面内的 GSAP 场景，无需 SPA fallback 或 404 路由技巧。`?render=1` 和横/竖屏导出入口继续可用。

`vercel.json` 和 `.vercelignore` 只保留为旧配置，不参与 GitHub Pages 构建或部署。Pages 不依赖其中的 headers，也不部署本机 FFmpeg 接口。线上 Export film 面板保留配置与本地导出命令；网站主体始终实时渲染。

## 本地检查

Node.js 22.12+：

```powershell
npm ci
npm run build
npm run test:production
npm run preview
```

生产预览地址：http://127.0.0.1:4173/ai-engineer-future-careers/

`test:production` 从真实构建解析 base，在严格的仓库子路径下托管 `dist`。浏览器回归检查所有场景、字体、首页链接、动画、全屏、移动触屏和控制台错误；访问宿主根目录不会被自动兜底，因此可发现写死 `/fonts` 或 `/assets` 的问题。

本地开发运行 `npm run dev`，地址仍是 http://127.0.0.1:5173/ 。本地视频导出继续使用 `npm run export:video -- --format landscape --fps 30`（也支持 60 FPS 与 portrait），需要本机 FFmpeg 和浏览器，不影响在线作品。

## 自动部署

`.github/workflows/deploy.yml` 在推送 main 或手动 workflow_dispatch 时运行：

1. GitHub 官方 checkout / setup-node 动作准备 Node 22。
2. `npm ci` 安装锁定依赖，`npm run build` 完成 TypeScript 与 Vite 构建。
3. upload-pages-artifact 只上传 `dist` 的网站文件。
4. configure-pages / deploy-pages 发布到 github-pages 环境。

官方 Actions 固定到完整提交 SHA；构建只有 contents: read 权限，部署 job 才有 pages: write 和 id-token: write。没有个人访问令牌或第三方部署服务。

`node_modules`、`.env*`、缓存、QA、测试记录、MP4、本地导出 JSON、dist 和 SONORA 都不进入源码提交。生产公开文件仅包含 HTML、编译后的 JS/CSS、两份 Geist 字体、字体许可证和图标。源码仓库保持 Private。

## Settings → Pages

1. 打开 https://github.com/Yalex12207/ai-engineer-future-careers/settings/pages 。
2. 在 Build and deployment → Source 选择 **GitHub Actions**；不要选择 Deploy from a branch，不创建 gh-pages 分支。
3. 如刚启用 Pages 后此前的 deploy job 已失败，到 Actions → Deploy Future Careers to GitHub Pages → Run workflow，选择 main。也可对该次运行选择 Re-run failed jobs。
4. 等待 build 和 deploy 都变绿，确认 github-pages 环境显示发布网址。
5. 保持 Enforce HTTPS（如显示该选项），用无痕窗口和另一台设备检查。

Private 仓库的 GitHub Pages 需要 GitHub Pro 或其他支持 Private Pages 的套餐；GitHub Free 仅支持 Public 仓库的 Pages。不要为开启 Pages 将这个源码仓库改为 Public。如果 Settings 显示套餐限制，需由你解决账户资格后重新运行 workflow。

本次实际启用检查：GitHub 返回 HTTP 422，提示 `Your current plan does not support GitHub Pages for this repository.`，因此目前未成功启用 Pages。代码和工作流已准备为上述子路径；解决账户资格后，选择 Source → GitHub Actions 并重新运行工作流即可。没有购买套餐或更改仓库可见性。

参考：[Vite GitHub Pages 部署](https://vite.dev/guide/static-deploy.html#github-pages)、[GitHub Pages 可用性](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)。

## 网站地址与验收

预期正式地址：https://yalex12207.github.io/ai-engineer-future-careers/

只有 Pages 已启用且 Actions 的 deploy 成功后，这个地址才可访问；提交 workflow 本身不代表已经上线。

- 在无痕窗口打开网址，不应要求 GitHub 登录。
- 首页署名、Geist 字体和几何图形完整显示。
- 滚轮、左右键、章节按钮、Play/Pause、Restart、Speaking notes、F/Fullscreen 和触屏切换正常。
- 五幕英文内容完整，横屏全屏无裁切；手机显示完整可读正文。
- 点 Future Careers 首页链接后仍在仓库子路径下，刷新也正常。
- Network 无字体、JS、CSS 或图标 404；Console 无错误；不请求 localhost、MP4 或本机导出接口。
- 不需要本机开发服务器在线，也不需要老师安装 Node、FFmpeg 或字体。

发布后可用实际地址进行回归：

```powershell
$env:POSTER_TEST_URL = 'https://yalex12207.github.io/ai-engineer-future-careers/'
$env:POSTER_PRODUCTION = '1'
npm run test:e2e
```

`npm run prepare:submission` 仍可生成白名单快照，并包含 Pages workflow。主项目是继续编辑的来源；GitHub 仓库工作副本应只同步审核过的项目文件，不使用父工作区的 Git 仓库。
