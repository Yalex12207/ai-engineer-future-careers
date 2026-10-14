import {chromium} from '@playwright/test';
import {existsSync} from 'node:fs';
import {mkdir,writeFile,rm} from 'node:fs/promises';

const base=process.env.POSTER_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({channel:process.env.POSTER_BROWSER_CHANNEL||(existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')?'msedge':undefined)});
try {
  await mkdir('qa/landscape',{recursive:true});
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  const errors=[], results=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  for(const fps of [30,60]) {
    const clip=await browser.newPage({viewport:{width:1920,height:1080}});
    clip.on('pageerror',e=>errors.push(e.message));
    clip.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const file=`${base}/exports/ai-engineer-landscape-${fps}.mp4`;
    // A separate QA player verifies the exported deliverable. The poster app
    // itself continues to render React/SVG scenes and contains no video tag.
    await clip.setContent(`<style>body{margin:0;background:#101010}video{display:block;width:100vw;height:100vh}</style><video muted preload="auto" src="${file}"></video>`);
    await clip.waitForFunction(()=>{const v=document.querySelector('video');if(v.error)throw new Error(v.error.message);return v.readyState>=2;});
    async function seek(time) {
      await clip.evaluate(t=>new Promise(resolve=>{const v=document.querySelector('video');v.addEventListener('seeked',()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)),{once:true});v.currentTime=t;}),time);
    }
    await seek(12);
    await clip.evaluate(()=>document.querySelector('video').play()); await clip.waitForTimeout(550);
    const info=await clip.evaluate(()=>{const v=document.querySelector('video');v.pause();return {duration:v.duration,width:v.videoWidth,height:v.videoHeight,currentTime:v.currentTime,readyState:v.readyState,error:v.error?.message??null,quality:v.getVideoPlaybackQuality().droppedVideoFrames};});
    if(info.duration!==55||info.width!==1920||info.height!==1080||info.currentTime<=12||info.error)throw new Error(`Playback verification failed: ${JSON.stringify(info)}`);
    results.push({fps,...info});
    if(fps===30) for(const [i,time] of [2,12,23,35,46.5].entries()) {await seek(time);await clip.screenshot({path:`qa/landscape/video-scene-${i+1}.png`});}
    await clip.close();
  }
  await page.goto(base);await page.waitForFunction(()=>window.__poster?.ready);
  await page.evaluate(()=>{window.__exportWatchProbe='preserved';window.__poster.go(3);});
  await page.waitForFunction(()=>!window.__poster.snapshot().transitioning);
  try {
    await writeFile('public/exports/.qa-watch-probe.txt','Export writes must not reload the poster.');
    const probePath='public/exports/ai-engineer-portrait-60.json';
    if(!existsSync(probePath)) {
      try {
        await writeFile(probePath,JSON.stringify({probe:true}));
        const response=await page.request.get(`${base}/exports/ai-engineer-portrait-60.json`);
        if(!response.ok()||(await response.json()).probe!==true)throw new Error('New export file was not immediately served.');
      } finally {await rm(probePath,{force:true});}
    }
    await page.waitForTimeout(1000);
    if(!await page.evaluate(()=>window.__exportWatchProbe==='preserved'&&window.__poster.snapshot().index===3))throw new Error('Export directory write reloaded the interactive presentation.');
  } finally {await rm('public/exports/.qa-watch-probe.txt',{force:true});}
  await page.getByRole('button',{name:'Export film',exact:true}).click();
  for(const fps of [30,60]) {
    await page.getByLabel('Export frame rate').selectOption(String(fps));
    await page.waitForSelector('a.download-button');
    const href=await page.locator('a.download-button').getAttribute('href');
    if(href!==`/exports/ai-engineer-landscape-${fps}.mp4`)throw new Error(`Wrong download: ${href}`);
  }
  await page.screenshot({path:'qa/landscape/export-options.png'});
  await writeFile('qa/landscape/video-playback.json',JSON.stringify({results,exportWritesPreserveScene:true,newExportsImmediatelyAvailable:true,errors},null,2));
  if(errors.length)throw new Error(errors.join('; '));
  console.log(JSON.stringify({results,errors}));
} finally {await browser.close();}
