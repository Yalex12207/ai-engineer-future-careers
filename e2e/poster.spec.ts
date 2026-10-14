import { test, expect, type Page } from '@playwright/test';
import { scenes } from '../src/content';
import { maximumPixelDifference } from './image-check';

async function ready(page: Page, url = '/') {
  await page.goto(url.replace(/^\//, '')); await page.waitForFunction(() => window.__poster?.ready);
}
async function settled(page: Page, index: number) {
  await expect.poll(() => page.evaluate(() => window.__poster!.snapshot().transitioning)).toBe(false);
  await expect(page.locator('.poster')).toHaveAttribute('data-active-scene', String(index));
}

test('default is a stable live widescreen poster; playback is opt-in and never requests MP4', async ({ page }) => {
  const media: string[] = []; page.on('request', request => { if (/\.mp4|__poster\/export/.test(request.url())) media.push(request.url()); });
  await page.route('**/*.mp4', route => route.abort()); await ready(page);
  expect(await page.evaluate(() => window.__poster!.snapshot().mode)).toBe('interactive');
  await expect(page.locator('video, .timeline-scrubber, input[type=range]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Play presentation', exact: true })).toBeVisible();
  await expect(page.locator('[data-scene="0"] h1')).toHaveText('AIENGINEER');
  const before = await page.locator('[data-scene="0"] h1').boundingBox();
  const rotation = await page.locator('[data-idle-spin]').evaluate(element => getComputedStyle(element).transform);
  await page.waitForTimeout(700);
  await settled(page, 0); expect(await page.locator('[data-scene="0"] h1').boundingBox()).toEqual(before);
  expect(await page.locator('[data-idle-spin]').evaluate(element => getComputedStyle(element).transform)).not.toBe(rotation);
  expect(media).toEqual([]);
});

test('wheel gestures advance once, reverse correctly, and lock overlapping input', async ({ page }) => {
  await ready(page); await page.mouse.wheel(0, 600);
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft');
  await settled(page, 1);
  const stable = await page.evaluate(() => window.__poster!.snapshot());
  await page.waitForTimeout(500); expect(await page.evaluate(() => window.__poster!.snapshot())).toEqual(stable);
  await page.mouse.wheel(0, -600); await settled(page, 0);
  await page.evaluate(() => {
    const app = document.querySelector('.career-app')!;
    for (let i = 0; i < 35; i++) app.dispatchEvent(new WheelEvent('wheel', { deltaY: 80, bubbles: true, cancelable: true }));
  });
  await settled(page, 1);
  expect(await page.evaluate(() => window.__poster!.diagnostics().activeTransitions)).toBe(0);
});

test('parallax moves geometry only; the reverse hero camera keeps real typography', async ({ page }) => {
  await ready(page);
  const title = await page.locator('h1').boundingBox();
  await page.mouse.move(1040, 420); await page.waitForTimeout(700);
  expect(await page.locator('h1').boundingBox()).toEqual(title);
  const offset = await page.locator('[data-parallax]').evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  expect(Math.abs(offset)).toBeGreaterThan(.5); expect(Math.abs(offset)).toBeLessThan(8);
  await page.keyboard.press('ArrowRight'); await settled(page, 1);
  await page.evaluate(() => { window.__poster!.go(0); window.__poster!.pause(); });
  expect(await page.evaluate(() => window.__poster!.diagnostics().manualDuration)).toBeCloseTo(1.8, 4);
  await expect(page.locator('.interactive-portal')).toBeHidden();
  await expect(page.locator('[data-scene="1"] h2')).toBeVisible();
  await page.evaluate(() => window.__poster!.play()); await settled(page, 0);
});

test('hero shot starts without a title jump, preserves geometry and cleans up at both ends', async ({ page }) => {
  await ready(page);
  const before=await page.locator('[data-scene="0"] h1').boundingBox();
  const spin=await page.evaluate(()=>{const before=getComputedStyle(document.querySelector('[data-idle-spin]')!).transform;window.__poster!.go(1);window.__poster!.pause();return before;});
  expect(await page.locator('[data-scene="0"] h1').boundingBox()).toEqual(before);
  expect(await page.locator('[data-idle-spin]').evaluate(e=>getComputedStyle(e).transform)).toBe(spin);
  await expect(page.locator('.poster')).toHaveClass(/hero-shot-active/);
  await expect(page.locator('.interactive-portal')).toBeHidden();
  await page.evaluate(()=>window.__poster!.play());await settled(page,1);
  await expect(page.locator('[data-hero-light]')).toBeHidden();
  await expect(page.locator('.poster')).not.toHaveClass(/hero-shot-active/);
  const work=await page.locator('[data-scene="1"] h2').boundingBox();
  await page.evaluate(()=>{window.__poster!.go(0);window.__poster!.pause();});
  expect(await page.locator('[data-scene="1"] h2').boundingBox()).toEqual(work);
  await page.evaluate(()=>window.__poster!.play());await settled(page,0);
  expect(await page.locator('[data-scene="0"] h1').boundingBox()).toEqual(before);
  await expect(page.locator('[data-hero-light]')).toBeHidden();
});

test('hero sequence reveals title before copy and keeps resize independent of camera progress', async ({ page }) => {
  await ready(page,'/?render=1');
  const opacity=async (selector:string)=>page.locator(selector).evaluate(e=>Number(getComputedStyle(e).opacity));
  await page.evaluate(()=>window.__poster!.seek(10+1.8*.2));
  expect(await opacity('[data-scene="0"] h1')).toBe(1);
  expect(await opacity('[data-scene="1"] h2')).toBe(0);
  await page.evaluate(()=>window.__poster!.seek(10+1.8*.62));
  expect(await opacity('[data-scene="1"] h2')).toBeGreaterThan(.8);
  expect(await opacity('.work-description')).toBe(0);
  await page.evaluate(()=>window.__poster!.seek(10+1.8*.9));
  expect(await opacity('[data-scene="1"] h2')).toBe(1);
  expect(await opacity('.work-description')).toBeGreaterThan(.8);
  const pose=await page.locator('[data-scene="1"] h2').getAttribute('style');
  await page.setViewportSize({width:1280,height:800});
  await expect.poll(async()=>{const b=await page.locator('.poster').boundingBox();return Math.abs(b!.width/b!.height-16/9);}).toBeLessThan(.001);
  expect(await page.locator('[data-scene="1"] h2').getAttribute('style')).toBe(pose);
  await page.evaluate(()=>window.__poster!.seek(11.8));await settled(page,1);
  await ready(page);await page.evaluate(()=>window.__poster!.go(1));
  await page.waitForFunction(()=>{if(window.__poster!.diagnostics().manualProgress<.55)return false;window.__poster!.pause();return true;});
  const held=await page.evaluate(()=>window.__poster!.diagnostics().manualProgress);
  await page.setViewportSize({width:1920,height:1080});await page.waitForTimeout(150);
  expect(await page.evaluate(()=>window.__poster!.diagnostics().manualProgress)).toBe(held);
  await page.evaluate(()=>window.__poster!.play());await settled(page,1);
});

test('changing reduced-motion during paused autoplay settles the hero shot immediately', async ({ page }) => {
  await ready(page);await page.keyboard.press('Space');
  await page.evaluate(()=>window.__poster!.seek(10.9));
  expect(await page.evaluate(()=>window.__poster!.snapshot().transitioning)).toBe(true);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(()=>page.evaluate(()=>window.__poster!.snapshot().transitioning)).toBe(false);
  await expect(page.locator('[data-scene="1"] h2')).toBeVisible();
  await expect(page.locator('[data-hero-light]')).toBeHidden();
  await page.keyboard.press('ArrowLeft');await settled(page,0);
  expect(await page.evaluate(()=>window.__poster!.diagnostics().ambientActive)).toBe(false);
});

test('trackpad momentum extending beyond a transition does not skip scenes', async ({ page }) => {
  await ready(page);
  await page.evaluate(async () => {
    const app = document.querySelector('.career-app')!;
    for (let i = 0; i < 24; i++) {
      app.dispatchEvent(new WheelEvent('wheel', { deltaY: 60, bubbles: true, cancelable: true }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });
  await settled(page, 1); await page.waitForTimeout(300);
  await page.mouse.wheel(0, 500); await settled(page, 2);
});

test('five GSAP transitions connect all chapters without crossfading entire panels', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await ready(page);
  const effects = ['Typography Zoom', 'Geometric Morph', 'Editorial Push', 'Mask Wipe', 'Match Cut'];
  for (let from = 0; from < 5; from++) {
    const to = (from + 1) % 5;
    await page.evaluate(index => window.__poster!.go(index), to);
    await expect(page.locator('.poster')).toHaveAttribute('data-transition', effects[from]);
    await page.waitForTimeout(320);
    const alphas = await page.locator('.scene').evaluateAll(elements => elements.map(element => Number(getComputedStyle(element).opacity)));
    expect(alphas.every(alpha => alpha === 0 || alpha === 1)).toBe(true);
    await settled(page, to);
    const covering = await page.locator('.interactive-portal, .interactive-morph, .interactive-wipe').evaluateAll(elements => elements.some(element => getComputedStyle(element).visibility !== 'hidden'));
    expect(covering).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('all five chapters retain readable English content without overflow', async ({ page }) => {
  await ready(page);
  for (let index = 0; index < 5; index++) {
    if (index) { await page.evaluate(i => window.__poster!.go(i), index); await settled(page, index); }
    const overflow = await page.locator(`[data-scene="${index}"]`).evaluate(scene => {
      const rect = scene.getBoundingClientRect();
      return [...scene.querySelectorAll('h1,h2,h3,p,li,.connection-equation,.foundation-grid')].filter(element => {
        const bounds = element.getBoundingClientRect();
        return bounds.left < rect.left - 1 || bounds.right > rect.right + 1 || bounds.bottom > rect.bottom - rect.height * .07;
      }).map(element => element.textContent);
    });
    expect(overflow, `overflow in scene ${index}`).toEqual([]);
    await expect(page.locator(`[data-scene="${index}"]`)).toBeVisible();
  }
  await expect(page.locator('.connection-description')).toHaveText('AI engineering applies programming, algorithms, data structures and mathematics to solve real-world problems.');
  await expect(page.locator('.project-card')).toHaveCount(4);
  await page.getByRole('button', { name: 'Speaking notes', exact: true }).click();
  await expect(page.locator('.presenter-notes')).toContainText('direct application of Computer Science');
});

test('keyboard and side arrows work while editing fields and modal content remain protected', async ({ page }) => {
  await ready(page); await page.keyboard.press('ArrowRight'); await settled(page, 1);
  await page.getByRole('button', { name: 'Previous scene', exact: true }).click(); await settled(page, 0);
  await page.getByRole('button', { name: 'Next scene', exact: true }).first().click(); await settled(page, 1);
  await page.evaluate(() => { const input = document.createElement('input'); input.id = 'editing-test'; document.querySelector('.career-app')!.append(input); input.focus(); });
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('f'); await page.keyboard.press('Space'); await page.keyboard.press('r'); await settled(page, 1);
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
  await page.locator('#editing-test').evaluate(element => element.remove());
  await page.getByRole('button', { name: 'Export film', exact: true }).click();
  await page.keyboard.press('ArrowRight'); await page.mouse.wheel(0, 500); await settled(page, 1);
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('touchscreen vertical swipes change chapters', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage(); await ready(page);
  const session = await context.newCDPSession(page);
  async function swipe(startY: number, endY: number) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: startY }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: endY }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await swipe(250, 130); await settled(page, 1);
  await expect(page.locator('.compact-reader')).toContainText('AI engineers develop intelligent systems');
  await swipe(130, 250); await settled(page, 0);
  await session.detach(); await context.close();
});

test('native 16:9 composition survives resizing and fills a 1920×1080 fullscreen', async ({ page }) => {
  await ready(page);
  for (const size of [{ width: 390, height: 844 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(size);
    await expect.poll(async () => { const bounds = await page.locator('.poster').boundingBox(); return bounds ? Math.abs(bounds.width / bounds.height - 16 / 9) : 1; }).toBeLessThan(.001);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await expect.poll(async () => (await page.locator('.poster').boundingBox())!.height).toBeCloseTo(1080, 0);
  await expect.poll(async () => (await page.locator('.poster').boundingBox())!.width).toBeCloseTo(1920, 0);
  await page.getByRole('button', { name: 'Next scene', exact: true }).click(); await settled(page, 1);
  await page.keyboard.press('Escape'); await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
});

test('reduced motion stays interactive and disables ambient motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await ready(page);
  expect(await page.evaluate(() => window.__poster!.diagnostics().ambientActive)).toBe(false);
  await page.keyboard.press('ArrowRight'); await settled(page, 1);
  expect(await page.evaluate(() => window.__poster!.snapshot().mode)).toBe('interactive');
});

test('landscape renderer supports deterministic forward and backward seeks', async ({ page }) => {
  await ready(page, '/?render=1');
  await expect(page.locator('video, .chapter-rail, .side-arrows')).toHaveCount(0);
  expect(await page.evaluate(() => window.__poster!.diagnostics().ambientActive)).toBe(false);
  for (const scene of scenes) {
    await page.evaluate(time => window.__poster!.seek(time), scene.stable);
    await expect(page.locator(`[data-scene="${scenes.indexOf(scene)}"]`)).toBeVisible();
  }
  expect(await page.evaluate(() => window.__poster!.duration)).toBe(55);
  const pose = async (time: number) => page.evaluate(t => { window.__poster!.seek(t); return [...document.querySelectorAll('.scene, [data-char], [data-portal-letters], [data-morph-shell]')].map(e => [e.getAttribute('style'), e.getAttribute('transform'), e.getAttribute('d')]); }, time);
  for (const time of [.7,10.6,21.6,33.6,44.6,54.2]) {
    const before = await pose(time); await pose(52); expect(await pose(time)).toEqual(before);
  }
  await ready(page); const before = await page.evaluate(() => window.__poster!.snapshot());
  await page.evaluate(() => window.__poster!.seek(46.5));
  expect(await page.evaluate(() => window.__poster!.snapshot())).toEqual(before);
});

test('play, pause, resume and restart work with mouse and keyboard', async ({ page }) => {
  await ready(page); await page.getByRole('button',{name:'Play presentation',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.__poster!.snapshot().time)).toBeGreaterThan(.3);
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.__poster!.snapshot().playing)).toBe(false);
  const frozenTime=await page.evaluate(()=>window.__poster!.snapshot().time);
  const pose=()=>page.locator('.poster').evaluate(root=>[...root.querySelectorAll('[style], [data-meridian]')].map(e=>[e.getAttribute('style'),e.getAttribute('rx')]));
  const frozenPose=await pose();
  const frozen = await page.locator('.poster').screenshot();
  await page.waitForTimeout(300);
  expect(await page.evaluate(()=>window.__poster!.snapshot().time)).toBe(frozenTime);
  expect(await pose()).toEqual(frozenPose);
  expect(maximumPixelDifference(frozen,await page.locator('.poster').screenshot())).toBeLessThanOrEqual(1);
  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => window.__poster!.snapshot().playing)).toBe(true);
  await page.evaluate(() => window.__poster!.seek(22));
  await page.keyboard.press('Space'); await page.keyboard.press('r');
  await expect.poll(() => page.evaluate(() => window.__poster!.snapshot().time)).toBeLessThan(2);
  await expect(page.locator('.career-app')).toHaveAttribute('data-mode','autoplay');
  await page.evaluate(() => window.__poster!.seek(54.85)); await page.keyboard.press('Space');
  await settled(page,0); expect(await page.evaluate(() => window.__poster!.snapshot().mode)).toBe('interactive');
  await page.keyboard.press('ArrowRight'); await settled(page,1);
  await page.getByRole('button',{name:'Restart presentation',exact:true}).click(); await settled(page,0);
});

test('presentation clock crosses all scenes and manual navigation restores stable interaction', async ({ page }) => {
  await ready(page); await page.keyboard.press('Space');
  for (let i=1;i<5;i++) {
    await page.evaluate(t => window.__poster!.seek(t),scenes[i].start-.05);
    await page.keyboard.press('Space');
    await expect.poll(() => page.evaluate(() => window.__poster!.snapshot().index)).toBe(i);
    await settled(page,i);
    await expect(page.locator('.chapter-progress button[aria-current="step"]')).toHaveAttribute('aria-label',`Scene ${i+1}: ${scenes[i].name}`);
  }
  await page.keyboard.press('ArrowLeft'); await settled(page,3);
  expect(await page.evaluate(() => window.__poster!.snapshot().mode)).toBe('interactive');
  await page.waitForTimeout(250); await settled(page,3);
});

test('legacy portrait export retains all five scenes at 1080×1920', async ({ page }) => {
  await page.setViewportSize({width:1080,height:1920}); await ready(page,'/?render=1&format=portrait');
  const rect = await page.locator('.poster').boundingBox(); expect(rect?.width).toBe(1080); expect(rect?.height).toBe(1920);
  for (let i=0;i<5;i++) {
    await page.evaluate(t => window.__poster!.seek(t),scenes[i].stable);
    await expect(page.locator(`[data-scene="${i}"]`)).toBeVisible();
  }
  await expect(page.locator('.connection-description')).toContainText('data structures and mathematics');
});

test('export offers 30/60 FPS and both aspect ratios with validation', async ({ page,request }) => {
  const localRequests: string[] = [];
  page.on('request', r => { if (/__poster\/export|\/exports\//.test(r.url())) localRequests.push(r.url()); });
  await ready(page); await page.getByRole('button',{name:'Export film',exact:true}).click();
  await expect(page.getByLabel('Export composition')).toHaveValue('landscape');
  await page.getByLabel('Export frame rate').selectOption('60');
  await expect(page.locator('.export-specs')).toContainText('1920 × 1080');
  await expect(page.locator('.export-command')).toContainText('--format landscape --fps 60');
  await page.getByLabel('Export composition').selectOption('portrait');
  await expect(page.locator('.export-specs')).toContainText('1080 × 1920');
  await page.getByLabel('Export frame rate').selectOption('30');
  if (process.env.POSTER_PRODUCTION === '1') {
    await expect(page.locator('.download-button')).toHaveCount(0);
    await expect(page.getByRole('button', {name: 'Render MP4', exact: true})).toHaveCount(0);
    expect(localRequests).toEqual([]);
    return;
  }
  await expect(page.locator('.download-button')).toHaveAttribute('href',/\/exports\/ai-engineer(?:-portrait-30)?\.mp4/);
  const invalid = await request.post('/__poster/export',{data:{format:'landscape',fps:45}}); expect(invalid.status()).toBe(400);
});

test('many rejected inputs and repeated full transitions retain bounded memory and one controller', async ({ page }) => {
  await ready(page); const session = await page.context().newCDPSession(page);
  await session.send('HeapProfiler.collectGarbage'); const before = await session.send('Runtime.getHeapUsage');
  for (let index = 1; index <= 8; index++) {
    const target = index % 5;
    await page.evaluate(i => { window.__poster!.go(i); for (let n = 0; n < 100; n++) window.__poster!.step(1); }, target);
    await settled(page, target);
  }
  await session.send('HeapProfiler.collectGarbage'); const after = await session.send('Runtime.getHeapUsage');
  expect(after.usedSize - before.usedSize).toBeLessThan(5 * 1024 * 1024);
  expect(await page.evaluate(() => window.__poster!.diagnostics().activeTransitions)).toBe(0);
  await expect(page.locator('.scene')).toHaveCount(5); await session.detach();
});
