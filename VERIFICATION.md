# Future Careers landscape upgrade — verification

本记录保存横屏升级时的验收结果。后续首页 1.8 秒连续镜头优化、最新回归与性能记录见 [HERO-VERIFICATION.md](HERO-VERIFICATION.md)。下述 1.35 秒首页转场与视频记录属于此前版本。

2026-10-13。在现有 ai-engineer-motion-poster 上增量修改，没有修改、删除或覆盖 SONORA。

源码检查确认原主画面使用 React + GSAP + SVG/CSS 实时渲染，无 video 主画面。技术栈继续使用 React、TypeScript、Vite、GSAP、本地 Geist 字体及矢量几何。

## 布局与视觉

- 原生舞台 1920×1080 / 16:9。首页标题与球体左右布局，第二幕任务横排，第三幕技能与工作地分栏，第四幕四列项目网格，第五幕专业关系与基础技能左右布局。
- 保留全部英文职业介绍、任务、技能、工作地与工作环境、四种实际项目、Computer Science 专业联系及讲解提示。
- 深灰、黑白与灰色，细线、留白、弱环境光和轻微几何景深；没有霓虹、复杂粒子或闪光。
- 浏览器在 390×844、1440×900、1920×1080 保持 16:9；桌面全屏舞台实测 1920×1080。不同显示比例完整居中，重要内容不裁切。
- 窄屏舞台下方提供当前幕完整英文信息，正文 15px；手机顶部排版重叠已修复。
- 五幕文字边界检测结果全部为空。截图位于 qa/landscape/scene-1.png 至 scene-5.png、mobile.png、fullscreen.png。

## 交互与动画

| 验收项 | 结果 |
| --- | --- |
| 默认状态 | 稳定首页，Interactive Mode，点击 Play 才开始自动演示 |
| 手动操作 | 滚轮、惯性输入、左右键、章节按钮、NEXT、实际触屏事件通过 |
| 输入保护 | 输入框、select、可编辑元素、组合键、导出模态窗口受保护 |
| 同步锁 | 转场中不叠加、不排队，结束后停留阅读状态 |
| 五种转场 | Typography Zoom、Geometric Morph、Editorial Push、Mask Wipe、Match Cut；1.35 秒，反向切换正常 |
| 标题和层次 | 标题逐字揭示，信息错层进入，镜头微推，元素柔和淡入，阅读时文字静止 |
| Play / Pause | 鼠标和 Space 均通过；暂停时海报截图逐像素一致；继续恢复动画 |
| Restart | 按钮与 R 通过；手动模式重放首页揭示，自动演示从头播放 |
| 自动演示 | 五幕和章进度正确推进；结束返回稳定首页；手动输入恢复交互模式 |
| Fullscreen | F、按钮、退出按钮及 Esc；全屏仍有演示控制和章节指示 |
| Atmosphere | 慢速球体、细线运动、几何视差；标题位置不受鼠标影响 |
| Notes | 当前幕英文讲解提示，侧栏单独布局，手机在舞台下方 |
| Reduced motion | 关闭持续几何与过场运动，保留交互和演示控制 |
| 资源 | 8 次完整过场与 800 次锁定输入后 GC 内存增长通过 5 MiB 阈值；完成后活动过场为 0 |
| 导出隔离 | 正常网页不请求 MP4；逐帧渲染无网页控制；新文件立即可下载且不会触发页面热重载 |
| Console | 最终截图与视频验证流程 console error / page error 均为空 |

npm run test:e2e：16 passed，Microsoft Edge (Chromium)，1.6 分钟。性能优化后全套再次通过。随后新增原竖屏视频下载回退逻辑，导出专项测试通过。

npm run capture:qa：五幕、五种过场中间帧、讲解面板、手机与全屏均完成。browser-errors.json 为 []，overflow.json 五幕均为 []。

## 性能测量

1920×1080 的本机 requestAnimationFrame 测量：

| 过场 | 准备时间 ms | 平均回调 FPS | p95 帧间隔 ms | 最长帧间隔 ms |
| --- | --- | --- | --- | --- |
| Typography Zoom | 5.2 | 152.6 | 6.3 | 81.5 |
| Geometric Morph | 4.5 | 159.9 | 6.2 | 18.4 |
| Editorial Push | 5.1 | 162.8 | 6.2 | 18.2 |
| Mask Wipe | 5.8 | 149.5 | 6.2 | 109.0 |
| Match Cut | 2.7 | 164.1 | 6.2 | 13.9 |

已减少每次切幕对所有隐藏章节字形的重复重置。多数帧间隔低于 60 FPS 的 16.7ms 预算；首次文字遮罩和全屏遮罩绘制仍有约 82 / 109ms 的短暂峰值，出现在过场起始阶段。本数据是本机 rAF 回调测量，不能作为其他设备或实际合成帧率保证。完整记录：qa/landscape/frame-timing.json。

## 导出验证

| 文件 | 分辨率 | FPS | 帧数 | 时长 | 编码 / 像素 | 完整解码 |
| --- | --- | --- | --- | --- | --- | --- |
| ai-engineer-landscape-30.mp4 | 1920×1080 | 30 | 1650 | 55.000s | H.264 / yuv420p | 通过 |
| ai-engineer-landscape-60.mp4 | 1920×1080 | 60 | 3300 | 55.000s | H.264 / yuv420p | 通过 |

30 FPS 通过本地网页导出接口实际渲染；60 FPS 通过 CLI 实际渲染。两者均逐帧 seek 共用 GSAP 横屏渲染器，经 ffprobe 检查规格，并经 FFmpeg -xerror 完整解码。输出位于 public/exports/，验证 sidecar 同名 .json。

Microsoft Edge 对两个 MP4 均已实际播放：duration=55，videoWidth=1920，videoHeight=1080，readyState=4，当前播放时间正常前进，media error=null，丢帧计数=0。30 FPS 五幕解码截图已人工检查；横屏 30/60 FPS 下载入口均通过。记录：qa/landscape/video-playback.json 与 video-scene-1.png 至 video-scene-5.png。

修复 Vite 对忽略监听后的新增 public 文件使用旧目录缓存的问题。导出文件现在由受限文件名的动态静态读取提供，支持 GET、HEAD、Range；导出目录写入不会刷新正在展示的海报。验证新增文件即时读取、场景状态保持及视频 seek 均通过。

原 1080×1920 / 30 FPS 的 ai-engineer.mp4 与其历史验证记录保持原样。新的 portrait 导出入口已回归五幕 seek 与精确 1080×1920 尺寸；导出选择支持横竖屏与 30/60 FPS。没有重新渲染旧竖屏完整视频。

## 构建与运行

最终 npm run build 成功：TypeScript + Vite 7.3.7，1597 modules，CSS 33.55kB，JS 350.82kB（gzip 112.53kB）。使用受限 Node 堆的构建命令，避免本机内存争用。两份横屏视频与原竖屏视频均进入 dist/exports/。

开发预览：http://127.0.0.1:5173/。生产预览：http://127.0.0.1:4173/。启动命令和修改文件列表见 README.md。

生产构建预览专项测试：2 passed，验证编译后页面仍保持实时互动、默认首页、16:9 响应式尺寸和精确 1920×1080 全屏。

本轮以本机 Edge 与模拟手机触屏验证；没有单独测试实际课堂投影设备、Safari、Firefox 或手机真机。
