import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

function option(name, fallback) { const index = process.argv.indexOf(name); return index < 0 ? fallback : process.argv[index + 1]; }
const url = option('--url', process.env.POSTER_URL || 'http://127.0.0.1:5173');
const format = option('--format', 'landscape');
const fps = Number(option('--fps', '30'));
if (!['landscape', 'portrait'].includes(format) || ![30,60].includes(fps)) throw new Error('Use --format landscape|portrait and --fps 30|60.');
const width = format === 'landscape' ? 1920 : 1080, height = format === 'landscape' ? 1080 : 1920;
const output = path.resolve(option('--output', `public/exports/ai-engineer-${format}-${fps}.mp4`));
const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
const ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';
const duration = 55, frames = fps * duration;
const partial = path.join(path.dirname(output), `${path.basename(output, '.mp4')}.partial.mp4`);
const channel = process.env.POSTER_BROWSER_CHANNEL || (process.platform === 'win32' && existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe') ? 'msedge' : undefined);
let browser, encoder, ffmpegError = '';
let cancelled = false;

async function capture(command, args) {
  const child = spawn(command, args, { windowsHide: true });
  let stdout = '', stderr = '';
  child.stdout.on('data', chunk => { stdout += chunk; }); child.stderr.on('data', chunk => { stderr += chunk; });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  if (code !== 0) throw new Error(`${command} failed: ${stderr.slice(-1500)}`);
  return stdout;
}
async function cancel() {
  cancelled = true; encoder?.kill(); await browser?.close().catch(() => {});
}
process.on('SIGINT', () => void cancel()); process.on('SIGTERM', () => void cancel());

try {
  await capture(ffmpegPath, ['-version']);
  await mkdir(path.dirname(output), { recursive: true });
  browser = await chromium.launch({ channel, headless: true, args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const target = new URL(url); target.searchParams.set('render', '1');
  target.searchParams.set('format', format);
  await page.goto(target.href, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__poster?.ready === true);
  await page.evaluate(async () => { await document.fonts.ready; window.__poster.pause(); });
  const bounds = await page.locator('.poster').boundingBox();
  if (!bounds || Math.abs(bounds.width - width) > 1 || Math.abs(bounds.height - height) > 1) throw new Error(`Poster viewport must be exactly ${width} × ${height}.`);

  encoder = spawn(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', '-filter_threads', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-threads', '2', '-framerate', String(fps), '-i', 'pipe:0', '-an', '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p', '-color_range', 'tv', '-c:v', 'libx264', '-threads', '2', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps), '-frames:v', String(frames), '-movflags', '+faststart', partial], { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] });
  const completion = new Promise((resolve, reject) => { encoder.once('error', reject); encoder.once('close', code => code === 0 ? resolve() : reject(new Error(`FFmpeg exited ${code}: ${ffmpegError}`))); });
  // Attach a rejection handler immediately; a missing encoder must not become
  // an unhandled rejection while screenshots are still being captured.
  void completion.catch(() => {});
  encoder.stderr.on('data', chunk => { ffmpegError = (ffmpegError + String(chunk)).slice(-2000); });
  encoder.stdin.on('error', () => {});
  console.log(`Rendering ${frames} deterministic frames · ${width} × ${height} · ${fps} FPS`);
  for (let frame = 0; frame < frames; frame++) {
    if (cancelled || encoder.exitCode !== null) throw new Error(cancelled ? 'Export cancelled.' : `Encoder stopped: ${ffmpegError}`);
    await page.evaluate(time => window.__poster.seek(time), frame / fps);
    const bytes = await page.screenshot({ type: 'jpeg', quality: 97, animations: 'allow', caret: 'hide' });
    if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain');
    if (frame % 150 === 0) console.log(`PROGRESS ${Math.floor(frame / frames * 96)}`);
  }
  encoder.stdin.end(); await completion;
  if (pageErrors.length) throw new Error(`Browser errors: ${pageErrors.join('; ')}`);
  const probe = JSON.parse(await capture(ffprobePath, ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height,r_frame_rate,nb_read_frames,pix_fmt:format=duration,size', '-of', 'json', partial]));
  const video = probe.streams[0];
  if (video.width !== width || video.height !== height || video.r_frame_rate !== `${fps}/1` || Number(video.nb_read_frames) !== frames || Math.abs(Number(probe.format.duration) - duration) > .05) throw new Error(`Video verification failed: ${JSON.stringify(probe)}`);
  // Decode every frame to detect a corrupt or unplayable file before delivery.
  await capture(ffmpegPath, ['-v', 'error', '-xerror', '-threads', '2', '-i', partial, '-f', 'null', '-']);
  await rename(partial, output);
  const info = { ...probe, verified: true, composition: format, fps, renderedAt: new Date().toISOString(), frameCount: frames, method: 'Playwright deterministic GSAP seek + FFmpeg H.264; full decode verified', browserErrors: pageErrors };
  await writeFile(output.replace(/\.mp4$/, '.json'), JSON.stringify(info, null, 2));
  console.log('PROGRESS 100');
  console.log(`Verified: ${output} (${(Number((await stat(output)).size) / 1024 / 1024).toFixed(1)} MB)`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error); process.exitCode = 1;
  encoder?.kill(); await rm(partial, { force: true }).catch(() => {});
} finally {
  await browser?.close().catch(() => {});
}
