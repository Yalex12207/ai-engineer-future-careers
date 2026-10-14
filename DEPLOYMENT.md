# AI Engineer — 在线作品交付

这是 React + TypeScript + Vite + GSAP 实时交互网站。五幕、1920×1080 横屏设计、动画、讲解提示、播放控制、全屏和首页 PRESENTED BY / Yalex / Computer H262 均保留。老师的电脑只需要现代浏览器，无需安装 Node、字体或 FFmpeg。

## 上传前准备

```powershell
npm run build
npm run test:production
npm run prepare:submission
```

`release/LATEST.json` 指向本次交付目录：

- `github-upload/`：经过白名单复制的独立源码目录，可交给 **Private GitHub repository**。
- `website/`：可直接由静态服务器提供的生产文件，与 `dist/` 一致。
- `MANIFEST.json`：逐文件大小、SHA-256 和未上传/未部署状态，仅用于本地审核。

不要从父工作区运行 `git add .`。父仓库含有 SONORA。不要上传整个工作区、node_modules、.env、缓存、qa、test-results、release、导出视频或本地 Git 历史。只在审核后的 `github-upload` 目录建立独立仓库。原网站目录仍是继续编辑的主项目；交付目录是快照，更新后需要重新构建、测试和生成。

已提供 `.gitignore`、`.vercelignore`、`.gitattributes`、锁定依赖的 `package-lock.json` 与 `vercel.json`。网站不需要环境变量、数据库或外部 API。生产构建关闭 source maps，公开文件仅包含 HTML、编译后的 JS/CSS、字体、字体许可证和 favicon。GitHub 源码仓库保持 Private；浏览器运行所需的编译后 JS/CSS 会由公开网站正常提供。

本地 Playwright + FFmpeg 导出代码和横/竖屏、30/60 FPS 选项仍保留。线上 Export film 面板提供原有配置和可复制的本地导出命令，不请求本机渲染接口、不上传已有 MP4。在线作品始终实时渲染。

## 确认后上传 GitHub

先确认：使用你的 GitHub 个人账户建立 `ai-engineer-future-careers` **Private** 仓库；只上传审核后的 `github-upload` 文件；允许在你的 Vercel 账户公开部署作品页面（包含 Yalex 和 Computer H262）。账户登录由你完成，不提供密码或令牌。

确认后，在 GitHub 创建一个空 Private 仓库，不自动添加 README。可使用 GitHub Desktop 添加 `github-upload` 本地仓库，检查 Changes 文件列表后提交并 Publish repository，保持 **Keep this code private**。也可以仅在该目录运行下面的 Git 命令；先把示例远程地址替换为你实际建立的 Private 仓库地址：

```powershell
git init -b main
git add .
git diff --cached --stat
git commit -m "Prepare AI Engineer interactive poster for submission"
git remote add origin https://github.com/YOUR_USERNAME/ai-engineer-future-careers.git
git push -u origin main
```

若要求配置提交身份，请使用你自己的 GitHub 身份或 GitHub 提供的 noreply 邮箱。不要将仓库改成 Public。

## 确认后部署 Vercel

1. 登录 [Vercel](https://vercel.com/new)，选择你的个人账户。
2. Add New → Project → Import Git Repository，连接 GitHub。授权 **Only select repositories**，只选上面的 Private 仓库。
3. 项目名建议 `ai-engineer-future-careers`；若重名，由你选择可用名字。Root Directory 为仓库根目录（`.`），不是父工作区。
4. 检查以下设置，再点击 Deploy。`vercel.json` 已声明构建设置，无需添加环境变量。

| 设置 | 值 |
| --- | --- |
| Framework Preset | Vite |
| Node.js Version | 22.x |
| Install Command | npm ci |
| Build Command | npm run build |
| Output Directory | dist |
| Production Branch | main |

Vercel 支持现有 Vite 项目，GitHub 集成可在后续推送时构建部署。参见 [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) 与 [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)。连接后，向 main 推送会更新正式作品；后续发布仍按你的确认要求执行。

## 老师用的 HTTPS 地址

部署成功后，打开 Project → Settings → Domains，复制绑定到 **Production** 的稳定 `https://…vercel.app` 域名。准确域名需等部署成功后才能确定，准备阶段的项目名不代表已获得该网址。

Settings → Deployment Protection 应允许老师匿名打开 Production 域名。可使用 **Standard Protection** 保持预览地址受保护；它不保护 Production domains。不要选择会保护正式域名的 All Deployments。参见 [Deployment Protection](https://vercel.com/docs/deployment-protection)。

在未登录 Vercel 的无痕窗口验证正式域名，确认没有登录门槛。不要提交可能要求 Vercel 登录的 Preview / 带随机构建编号的地址。

## 发布后最终检查

- HTTPS 正常，首页 Yalex / Computer H262 清晰可见。
- 字体、SVG、JS 和 CSS 全部加载成功；页面不请求 localhost、MP4 或本地导出接口。
- 五幕英文内容完整；滚轮、←/→、章节、Play/Pause、Restart、Speaking notes、F/Fullscreen 正常。
- 1920×1080 全屏与普通浏览器窗口无裁切；手机窄屏提供完整可读正文。
- 另一台电脑或手机使用自己的网络打开同一 Production 网址。无需本机开发服务器运行。
- 匿名访问无登录页、无控制台错误。完成这些检查后，再把实际 HTTPS 网址交给老师。

如已部署且希望自动检查，可保持无痕可访问后运行：

```powershell
$env:POSTER_TEST_URL = 'https://实际正式域名.vercel.app'
$env:POSTER_PRODUCTION = '1'
npm run test:e2e
```

本地运行仍使用 `npm run dev`；本地生产预览使用 `npm run preview`。本文件不执行任何上传或部署。
