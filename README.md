# Future Careers — AI Engineer

在现有 React + TypeScript + Vite + GSAP 项目上完成横屏升级。主舞台以 **1920×1080 / 16:9** 为原生设计尺寸，五幕采用新的横屏版式，完整保留英文职业信息、SVG/CSS 几何和黑白灰主题。没有修改 SONORA。

页面由 React 与 GSAP 实时渲染，没有用 video 或 MP4 替代网页。首次打开保持稳定的 **Interactive Mode** 首页；点击 Play 才启动 55 秒自动演示。

首页左下角署名为 PRESENTED BY / Yalex / Computer H262，姓名为白色、班级为浅灰色。初次打开在标题稳定显示后用 0.6 秒淡入并上移 12px；重启与自动演示在标题揭示完毕后显示署名。切幕与返回共用原 GSAP 时间轴，支持提前导航、暂停、减少运动偏好和全屏。

## 启动

Node.js 22.12+，依赖已安装。

```powershell
cd "ai-engineer-motion-poster"
npm run dev
```

开发预览：[http://127.0.0.1:5173/](http://127.0.0.1:5173/)。

```powershell
npm run build
npm run preview
```

生产预览：[http://127.0.0.1:4173/](http://127.0.0.1:4173/)。产物位于 `dist/`。构建命令限制 Node 堆与年轻代大小，适应当前 Windows 主机的内存条件；不影响网页运行。

## 交互

- 滚轮、← / →、章节按钮、Previous / NEXT：切换场景，过场结束后停留阅读。
- 手机上在横屏舞台上下滑动：切换场景；舞台下方提供当前幕完整英文正文。
- Play / Pause 或 Space：开始、暂停、继续自动演示；手动过场也可以暂停与继续。
- Restart 或 R：从首页重新开始；正在自动演示时重新播放，手动模式重放标题揭示后停留首页。
- 自动演示结束后回到稳定首页。手动切换会退出自动演示，恢复交互模式。
- 五段章节指示显示当前幕和演示进度，无可拖动的视频时间轴。
- F / Fullscreen：电脑全屏展示；Esc / Exit fullscreen：退出。16:9 显示器填满画面，其他比例完整居中。
- Speaking notes：当前幕英文讲解提示。桌面侧栏与舞台分开布局，手机在舞台下方。
- 编辑输入框、select、可编辑内容、组合键和导出模态窗口受到快捷键保护。
- 首页与第二幕之间为 1.8 秒连续镜头，其余转场 1.35 秒；同步锁定重复输入，同一触控板惯性手势只切换一幕。
- 标题逐字揭示、层次入场、遮罩、镜头推进和元素柔和淡入均由 GSAP 控制。文字在阅读状态保持静止。
- 首页线框球体缓慢旋转、线条微动、几何小幅视差。后台和舞台不可见时停用持续运动。
- 系统 reduced motion 设置关闭持续运动，直接切换阅读状态，并保留演示控制。

## 五幕

| 场景 | 内容 | 过场 |
| --- | --- | --- |
| 01 AI ENGINEER | Designing Intelligence. Shaping Tomorrow.；Computer Science → AI | Typography Zoom：真实标题推进移出，白色区域扩张，第二幕沿同一镜头落位；反向为精确镜像 |
| 02 WHAT THEY DO | 数据、算法、机器学习；准备数据、训练评估、部署改进 | Geometric Morph：线框球体变为圆环并与下幕对齐 |
| 03 SKILLS & WORKPLACE | Python、Mathematics、Machine Learning、Teamwork、Problem-Solving；Technology Companies、Research Labs、Startups；办公、实验室、远程协作 | Editorial Push：横向版式推进，模块错层进入 |
| 04 REAL-WORLD PROJECTS | AI Assistants、Robotics、Computer Vision、Healthcare AI 与实际用途 | Mask Wipe：斜边黑白几何遮罩 |
| 05 CONNECTION TO COMPUTER SCIENCE | 编程、算法、数据结构、数学的专业联系与作用 | Match Cut：分隔线变圆，与首页球体连续衔接 |

第五幕完整保留：**AI engineering applies programming, algorithms, data structures and mathematics to solve real-world problems.**

首页镜头使用统一 GSAP Timeline：0–20% 轻推与几何视差，20–48% 标题放大移出与背景淡出，48–75% 扩张白色区域并引入第二幕标题，75–100% 减速落位并依次揭示正文和图示。主动画使用 transform / opacity，不再用 SVG 复制标题替换真实标题。滚轮继续作为章节手势触发，保持既有输入锁和稳定阅读状态，不创建滚动页面或叠加 scrub 缓动。

## 导出

需要 FFmpeg / ffprobe 与 Chromium 或本机 Microsoft Edge。保持预览运行，在另一个终端执行：

```powershell
npm run export:video -- --format landscape --fps 30
npm run export:video -- --format landscape --fps 60
npm run export:video -- --format portrait --fps 30
```

或 Export film → 选择 Composition / Frame rate → Render MP4。

所有配置均为 55 秒 MP4 H.264：横屏 **1920×1080**，竖屏 **1080×1920**，帧率支持 **30 / 60 FPS**。默认横屏 30 FPS。新文件命名为 `public/exports/ai-engineer-{landscape|portrait}-{30|60}.mp4`。此前 `ai-engineer.mp4` 竖屏视频保持原样。

已有视频文件保留此前已验证版本。要把最新首页镜头写入视频，请使用 Render again 或上面的导出命令重新生成。

横屏网页播放与导出使用相同的 GSAP 场景渲染器。`?render=1&format=landscape` 为无界面逐帧渲染入口；`?render=1&format=portrait` 保留旧竖屏组件与时间线。脚本逐帧 seek，导出 1,650 / 3,300 帧，再检查分辨率、帧率、时长、帧数并完整解码。临时文件只有通过验证才替换正式文件。

Vite 开发服务器提供本地渲染接口和已有文件下载。生产静态页面保留导出选项与 CLI 命令，不请求本地渲染接口；公开构建只含网站所需字体、图标与编译文件，已有 MP4 和诊断 JSON 留在本机。无浏览器时先运行 `npx playwright install chromium`。支持环境变量 `FFMPEG_PATH`、`FFPROBE_PATH`、`POSTER_BROWSER_CHANNEL`、`POSTER_URL`。

## 在线交付

Vercel 部署、Private GitHub 上传流程及老师用的正式 HTTPS 地址检查见 [DEPLOYMENT.md](DEPLOYMENT.md)。上传与部署需先经你确认。`npm run test:production` 使用真正的静态生产文件运行浏览器回归；`npm run prepare:submission` 生成隔离的源码白名单快照和公开网站快照，避免上传父工作区中的 SONORA、缓存或私人文件。

## 验证与结构

```powershell
npm run test:e2e
npm run capture:qa
node scripts/measure-motion.mjs
node scripts/verify-exports.mjs
node scripts/capture-hero.mjs
node scripts/measure-hero.mjs
```

截图、溢出检测、控制台记录与帧时间位于 `qa/landscape/`；`verify-exports.mjs` 实际播放两个完整横屏视频，并检查下载与导出目录写入隔离。验收结果见 [VERIFICATION.md](VERIFICATION.md)。

首页镜头的关键帧、反向播放、转场中缩放截图及帧时间位于 `qa/hero/`；专项验收见 [HERO-VERIFICATION.md](HERO-VERIFICATION.md)。

```text
src/content.ts                            共享英文内容、章节、讲解提示
src/layout.ts                             横竖屏尺寸与导出文件名
src/components/Scenes.tsx                 五幕横屏版式与逐字标题
src/components/PortraitScenes.tsx         原竖屏导出版式
src/components/TransitionLayers.tsx       SVG 字母遮罩、形态与全屏遮罩
src/components/CompactReader.tsx          窄屏可读正文
src/components/ExportPanel.tsx            横竖屏、30/60 FPS 导出选择
src/animation/interactive-transitions.ts  共用五种转场与完整阅读状态
src/animation/hero-transition.ts         1.8 秒连续镜头与精确反向时间映射
src/animation/signature.ts               共用 0.6 秒署名揭示
src/animation/film-renderer.ts            自动演示 / 导出共用确定性渲染器
src/animation/usePoster.ts                播放、暂停、重启、手动切换与清理
src/animation/useSceneInput.ts            滚轮、触屏、键盘和输入保护
src/animation/atmosphere.ts               持续几何运动与复用视差 tween
src/animation/timeline.ts                 原竖屏导出时间线
src/App.tsx                               响应式舞台、控制、章节进度、全屏
src/landscape.css                         原生 1920×1080 横屏视觉系统
scripts/export-video.mjs                  Playwright + FFmpeg 双格式导出
vite.config.ts                            本地渲染接口与参数验证
```

五幕始终挂载，避免组件替换闪烁。GSAP 只保持一条当前过场；演示只保留当前渲染阶段，状态更新限制为约 10 Hz；卸载清理动画、监听、观察器和手势定时器。transform、opacity 与矢量坐标是主要动画属性。

Geist 字体许可证见 `public/fonts/OFL.txt`。动画 API 参考：[GSAP timeline](https://gsap.com/docs/v3/GSAP/Timeline/)、[GSAP quickTo](https://gsap.com/docs/v3/GSAP/gsap.quickTo%28%29/)。
