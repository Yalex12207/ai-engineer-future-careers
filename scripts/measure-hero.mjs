import {chromium} from '@playwright/test';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:process.env.POSTER_BROWSER_CHANNEL||(existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')?'msedge':undefined)});
try {
  await mkdir('qa/hero',{recursive:true});
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  await page.goto(process.env.POSTER_URL||'http://127.0.0.1:5173/');await page.waitForFunction(()=>window.__poster?.ready);
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
  const results=[];
  for(const [i,target] of [1,0,1,0].entries()) {
    const before=await cdp.send('Performance.getMetrics');
    const timing=await page.evaluate(async index=>{
      const start=performance.now(),deltas=[],longFrames=[];let last=start;
      window.__poster.go(index);const prepare=performance.now()-start;
      await new Promise(resolve=>{const tick=now=>{
        const delta=now-last;deltas.push(delta);if(delta>25)longFrames.push({atMs:Math.round(now-start),frameMs:+delta.toFixed(1)});last=now;
        if(window.__poster.snapshot().transitioning)requestAnimationFrame(tick);else resolve();
      };requestAnimationFrame(tick);});
      const sorted=[...deltas].sort((a,b)=>a-b);
      return {preparationMs:+prepare.toFixed(1),averageRafFps:+(1000*deltas.length/(last-start)).toFixed(1),p95FrameMs:+sorted[Math.floor(sorted.length*.95)].toFixed(1),maxFrameMs:+Math.max(...deltas).toFixed(1),longFrames};
    },target);
    const after=await cdp.send('Performance.getMetrics');
    const metric=(list,name)=>list.metrics.find(m=>m.name===name)?.value??0;
    results.push({direction:target?'forward':'reverse',run:i<2?'cold':'warm',...timing,layouts:metric(after,'LayoutCount')-metric(before,'LayoutCount')});
  }
  await writeFile('qa/hero/frame-timing.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
  await cdp.detach();
} finally {await browser.close();}
