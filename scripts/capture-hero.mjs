import {chromium} from '@playwright/test';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.POSTER_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({channel:process.env.POSTER_BROWSER_CHANNEL||(existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')?'msedge':undefined)});
try {
  await mkdir('qa/hero',{recursive:true});
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`${base}?render=1`);await page.waitForFunction(()=>window.__poster?.ready);
  const phases=[];
  for(const progress of [0,.1,.2,.34,.48,.62,.75,.9,1]) {
    await page.evaluate(p=>window.__poster.seek(10+p*1.8),progress);
    await page.locator('.poster').screenshot({path:`qa/hero/forward-${Math.round(progress*100)}.png`});
    phases.push(await page.evaluate(p=>{
      const root=document.querySelector('.poster'),title=root.querySelector('[data-scene="1"] h2');
      return {progress:p,heroOpacity:getComputedStyle(root.querySelector('[data-scene="0"]')).opacity,workOpacity:getComputedStyle(root.querySelector('[data-scene="1"]')).opacity,titleOpacity:getComputedStyle(title).opacity,titleTransform:getComputedStyle(title).transform,lightTransform:getComputedStyle(root.querySelector('[data-hero-light]')).transform};
    },progress));
  }
  await page.goto(base);await page.waitForFunction(()=>window.__poster?.ready);
  await page.evaluate(()=>window.__poster.go(1));await page.waitForFunction(()=>!window.__poster.snapshot().transitioning);
  await page.evaluate(()=>window.__poster.go(0));
  for(const progress of [.1,.25,.48,.62,.8]) {
    await page.waitForFunction(p=>{if(window.__poster.diagnostics().manualProgress<p)return false;window.__poster.pause();return true;},progress);
    await page.locator('.poster').screenshot({path:`qa/hero/reverse-${Math.round(progress*100)}.png`});
    await page.evaluate(()=>window.__poster.play());
  }
  await page.waitForFunction(()=>!window.__poster.snapshot().transitioning);
  await page.locator('.poster').screenshot({path:'qa/hero/reverse-100.png'});
  await page.evaluate(()=>window.__poster.go(1));
  await page.waitForFunction(()=>{if(window.__poster.diagnostics().manualProgress<.56)return false;window.__poster.pause();return true;});
  await page.setViewportSize({width:1280,height:800});await page.locator('.poster').screenshot({path:'qa/hero/resized.png'});
  await page.evaluate(()=>window.__poster.play());await page.waitForFunction(()=>!window.__poster.snapshot().transitioning);
  await page.screenshot({path:'qa/hero/settled-desktop.png'});
  await writeFile('qa/hero/inspection.json',JSON.stringify({phases,errors},null,2));
  if(errors.length)throw new Error(errors.join('; '));
  console.log(JSON.stringify({phases,errors}));
} finally {await browser.close();}
