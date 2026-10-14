import {chromium} from '@playwright/test';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:process.env.POSTER_BROWSER_CHANNEL||(existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')?'msedge':undefined)});
try{
  await mkdir('qa/landscape',{recursive:true});
  const page=await browser.newPage({viewport:{width:1600,height:1000}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(process.env.POSTER_URL||'http://127.0.0.1:5173/');await page.waitForFunction(()=>window.__poster?.ready);
  await page.screenshot({path:'qa/landscape/desktop.png'});await page.locator('.poster').screenshot({path:'qa/landscape/scene-1.png'});
  const overflow=[];
  for(let index=0;index<5;index++){
    if(index){await page.evaluate(i=>window.__poster.go(i),index);await page.waitForFunction(()=>!window.__poster.snapshot().transitioning);await page.locator('.poster').screenshot({path:`qa/landscape/scene-${index+1}.png`});}
    overflow.push(await page.locator(`[data-scene="${index}"]`).evaluate(scene=>{const r=scene.getBoundingClientRect();return [...scene.querySelectorAll('h1,h2,h3,p,li,.work-diagram,.project-grid,.foundation-grid,.connection-equation')].filter(e=>{const b=e.getBoundingClientRect();return b.left<r.left||b.right>r.right+1||b.bottom>r.bottom-30;}).map(e=>e.textContent);}));
  }
  await page.getByRole('button',{name:'Restart presentation',exact:true}).click();await page.waitForFunction(()=>!window.__poster.snapshot().transitioning);
  for(let target=1;target<=5;target++){await page.evaluate(i=>window.__poster.go(i%5),target);await page.waitForTimeout(500);await page.evaluate(()=>window.__poster.pause());await page.locator('.poster').screenshot({path:`qa/landscape/transition-${target}.png`});await page.evaluate(()=>window.__poster.play());await page.waitForFunction(()=>!window.__poster.snapshot().transitioning);}
  await page.getByRole('button',{name:'Speaking notes',exact:true}).click();await page.screenshot({path:'qa/landscape/notes.png'});await page.getByRole('button',{name:'Close speaking notes'}).click();
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/landscape/mobile.png',fullPage:true});
  await page.setViewportSize({width:1920,height:1080});await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await page.waitForFunction(()=>Math.abs(document.querySelector('.poster').getBoundingClientRect().width-1920)<1);await page.screenshot({path:'qa/landscape/fullscreen.png'});
  await writeFile('qa/landscape/browser-errors.json',JSON.stringify(errors,null,2));await writeFile('qa/landscape/overflow.json',JSON.stringify(overflow,null,2));
  console.log(JSON.stringify({errors,overflow}));
}finally{await browser.close();}
