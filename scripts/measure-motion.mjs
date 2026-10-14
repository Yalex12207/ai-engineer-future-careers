import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
const channel = process.env.POSTER_BROWSER_CHANNEL || (existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe') ? 'msedge' : undefined);
const browser = await chromium.launch({ channel });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(process.env.POSTER_URL || 'http://127.0.0.1:5173/');
  await page.waitForFunction(() => window.__poster?.ready);
  const result = [];
  for (let i = 0; i < 5; i++) {
    result.push(await page.evaluate(async () => {
      const deltas = [], longFrames = [], start = performance.now(); let last = start;
      window.__poster.step(1);
      const preparationMs = performance.now() - start;
      const sampleDuration=window.__poster.diagnostics().manualDuration*1000+300;
      const effect = window.__poster.snapshot().effect;
      await new Promise(resolve => {
        const frame = now => {
          if (now - last > 25) longFrames.push({atMs:Math.round(now-start),frameMs:+(now-last).toFixed(1)});
          deltas.push(now - last); last = now;
          if (now - start < sampleDuration) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
      const sorted = [...deltas].sort((a,b) => a-b);
      return { effect, preparationMs:+preparationMs.toFixed(1), frames: deltas.length, averageFps: +(1000/(deltas.reduce((a,b)=>a+b,0)/deltas.length)).toFixed(1), p95FrameMs: +sorted[Math.floor(sorted.length*.95)].toFixed(1), maxFrameMs: +Math.max(...deltas).toFixed(1), longFrames };
    }));
  }
  await writeFile('qa/landscape/frame-timing.json', JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
