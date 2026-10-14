# Hero camera transition — verification

2026-10-13。在现有 AI Engineer Motion Poster 上修改，主题、英文内容、1920×1080 横屏版式、五幕导航、播放控制和导出入口保持可用；SONORA 未修改。

## 源码检查与原因

首页 AI ENGINEER 与第二幕 Making machines intelligent 位于 `src/components/Scenes.tsx`。五幕常驻，没有路由切换。`useSceneInput.ts` 将滚轮、键盘、点击和触屏作为章节手势；自动演示与导出由 `film-renderer.ts` 逐帧 seek 共用转场。滚轮不是文档滚动位置驱动，因此保留既有输入锁与时间驱动的 ease，不添加 ScrollTrigger 或多重 scrub。

旧首页转场在 0.08 秒隐藏真实标题，替换为测量字体后生成的 SVG 字形遮罩，并在 1.2 秒直接隐藏遮罩。标题与背景几何缺少共同的相机运动；字体副本和超大 SVG 遮罩存在首轮绘制开销。原布局未每帧改动 top / left / width，突兀切换主要来自上述离散替换和图层绘制。

## 本轮实现

统一 1.8 秒 GSAP Timeline，真实标题始终为原 DOM 元素：

| 镜头进度 | 行为 |
| --- | --- |
| 0–20% | 首页和标题轻推，球体以不同速度移动，建立前后层次 |
| 20–48% | 标题继续放大并向外移，几何与附属文字逐渐淡出，白色平面从标题边缘扩张 |
| 48–75% | 白色区域覆盖舞台，第二幕标题沿共同相机坐标进入并落位 |
| 75–100% | 镜头减速停止，章节标签、正文、图示、任务和页眉页脚依次出现 |

主动画仅改变 transform / opacity。白色平面尺寸固定，使用 scale 扩张；无字体复制、字体尺寸动画或该镜头内的 clip-path 动画。正反向共用同一组关键帧，反向时间位置与 ease 使用精确镜像。

原 1.35 秒的其他四种转场保持。自动演示/导出已识别首页 1.8 秒过场，完整时间仍为 55 秒；此前生成的 MP4 保留旧版本，需要 Render again 才包含本轮镜头。

输入锁继续防止重叠和排队；手动切换后稳定停留。ResizeObserver 只缩放外层舞台，不重建镜头时间轴。动态 reduced-motion 偏好在暂停的自动演示中也能立即进入完整阅读状态。预热首页可见图层，并清理请求帧、观察器、事件与过场。

## 浏览器验证

Microsoft Edge / Chromium 实际渲染验证：

- 首页、第二幕起止标题边界保持一致，真实标题不瞬移，球体的已有旋转角度不会在转场开始时重置。
- 正向关键帧 0、10、20、34、48、62、75、90、100%，以及真实反向播放、途中暂停/继续和窗口缩放截图已人工检查。
- 两幕在镜头期间 opacity 均为 1；白色区域通过空间扩张覆盖，不用整页交叉淡化代替镜头。
- 标题先进入，正文后出现；结束后背景、文字和几何回到完整阅读状态，临时镜头层隐藏。
- 快速重复滚轮与按键不重叠；2.4 秒触控板惯性输入跨过 1.8 秒镜头后仍只切换一幕。
- 暂停时逻辑时间与所有元素样式/几何坐标完全不变。GPU 字体栅格化产生少量 1 级颜色差异，像素比较仅允许最大 1/255 的通道差异；继续和重启通过。
- 16:9、全屏、手机触屏、讲解提示、编辑保护、五幕自动播放、确定性前后 seek、旧竖屏导出、内存阈值均通过。
- 19 项回归用例均已通过验证：完整运行中的 17 项通过，中断期间两项等待超时，恢复后专项补测两项通过；延长后的惯性用例再次通过。
- `qa/hero/inspection.json` 的 console error / page error 均为空。关键帧和缩放截图位于 `qa/hero/`。

## 帧时间

`node scripts/measure-hero.mjs`，1920×1080 浏览器窗口，本机 rAF 测量：

| 方向 | 运行 | 准备 ms | 平均 rAF FPS | p95 帧间隔 ms | 最长帧间隔 ms | LayoutCount 增量 |
| --- | --- | --- | --- | --- | --- | --- |
| 正向 | 首轮 | 4.3 | 160.4 | 6.2 | 44.1 | 11 |
| 反向 | 首轮 | 2.5 | 164.3 | 6.2 | 18.2 | 2 |
| 正向 | 重复 | 2.2 | 165.4 | 6.2 | 12.1 | 2 |
| 反向 | 重复 | 1.9 | 165.7 | 6.2 | 12.1 | 2 |

多数帧低于 60 FPS 的 16.7 ms 预算。首轮仍有约 44 ms 绘制峰值，已从预热前约 96–106 ms 降低；重复镜头最长约 12 ms。布局增量主要集中在初始化与结束，没有逐帧布局重排。此为本机回调与布局指标，不是所有设备实际合成帧率的保证；未单独测试课堂投影硬件、Safari、Firefox 或手机真机。

原始数据：`qa/hero/frame-timing.json`。

## 修改文件与命令

| 文件 | 改动 |
| --- | --- |
| src/animation/hero-transition.ts | 新增统一镜头、光面、真实标题与反向关键帧 |
| src/animation/interactive-transitions.ts | 接入 1.8 秒首页转场、时长选择及阅读状态复位 |
| src/animation/film-renderer.ts | 新过场时长与动态 reduced-motion 阶段缓存 |
| src/animation/usePoster.ts | 图层准备、诊断进度、减少运动设置与生命周期清理 |
| src/components/Scenes.tsx | 增加独立光面与第二幕渐变面，保留原版式 |
| src/landscape.css | 相机图层和光面样式、局部 GPU 提示 |
| e2e/poster.spec.ts / image-check.ts | 连续性、暂停、缩放、减少运动与惯性检查 |
| scripts/capture-hero.mjs / measure-hero.mjs | 关键帧截图与帧时间/布局测量 |
| scripts/measure-motion.mjs | 测量窗口适配不同转场时长 |
| README.md / VERIFICATION.md / HERO-VERIFICATION.md | 使用说明、本轮验收与历史记录区分 |

```powershell
npm run dev
npm run build
npm run test:e2e
node scripts/capture-hero.mjs
node scripts/measure-hero.mjs
```

开发预览：[http://127.0.0.1:5173/](http://127.0.0.1:5173/)。

最终 `npm run build` 成功：TypeScript 与 Vite 均通过，1598 modules，CSS 34.86 kB，JS 354.38 kB（gzip 113.57 kB）。开发预览 HTTP 200，现有预览服务继续运行。
