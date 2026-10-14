import { test, expect } from '@playwright/test';

if (process.env.POSTER_PRODUCTION === '1') {
  test('clean production works without local services, remote assets or exposed private files', async ({page, request, baseURL}) => {
    const origin = new URL(baseURL!).origin;
    const base = new URL(baseURL!).pathname;
    const external: string[] = [], errors: string[] = [], failed: string[] = [];
    const outsideBase: string[] = [];
    page.on('request', request => {
      const url=new URL(request.url());
      if(url.origin===origin&&!url.pathname.startsWith(base))outsideBase.push(url.pathname);
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {if(message.type()==='error') errors.push(message.text());});
    page.on('response', response => {if(response.status()>=400) failed.push(response.url());});
    await page.route('**/*', route => {
      if (new URL(route.request().url()).origin !== origin) {external.push(route.request().url());return route.abort();}
      return route.continue();
    });
    await page.goto('./');
    await page.waitForFunction(() => window.__poster?.ready);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('40px Geist'))).toBe(true);
    const signature = page.locator('[data-signature]');
    await expect(signature).toContainText('PRESENTED BY');
    await expect(signature).toContainText('Yalex');
    await expect(signature).toContainText('Computer H262');
    await expect.poll(() => signature.evaluate(e=>Number(getComputedStyle(e).opacity))).toBe(1);
    await page.getByRole('button',{name:'Speaking notes',exact:true}).click();
    await expect(page.getByRole('complementary',{name:'Speaking notes'})).toBeVisible();
    await page.getByRole('button',{name:'Close speaking notes'}).click();
    await page.getByRole('button',{name:'Export film',exact:true}).click();
    await page.getByLabel('Export frame rate').selectOption('60');
    await page.getByRole('button',{name:'Close export panel'}).click();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => page.evaluate(()=>window.__poster!.snapshot().transitioning)).toBe(false);
    await expect(page.locator('.work-description')).toContainText('AI engineers develop intelligent systems');
    for (const path of ['/src/App.tsx','/.env','/.git/config','/package.json','/exports/ai-engineer.mp4','/qa/signature/inspection.json']) {
      expect((await request.get(new URL(path.slice(1),baseURL!).href)).status(),path).toBe(404);
    }
    await expect(page.getByRole('link',{name:'Future Careers home'})).toHaveAttribute('href',base);
    await page.getByRole('link',{name:'Future Careers home'}).click();
    await page.waitForFunction(()=>window.__poster?.ready);
    await expect(page).toHaveURL(baseURL!);
    await expect(page.locator('.poster')).toHaveAttribute('data-active-scene','0');
    expect(outsideBase).toEqual([]);
    expect(external).toEqual([]); expect(failed).toEqual([]); expect(errors).toEqual([]);
  });
}
