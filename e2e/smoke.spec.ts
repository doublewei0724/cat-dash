import { test, expect } from '@playwright/test';

test('offline game opens, starts and pauses', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/貓咪跑酷/);
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: '儲存暱稱' }).click();
  await expect(page.locator('#game')).toHaveAttribute('data-scene', 'menu');
  await page.locator('canvas').click({ position: { x: 195, y: 609 } });
  await expect(page.locator('#game')).toHaveAttribute('data-scene', 'game');
  await page.locator('canvas').click({ position: { x: 344, y: 157 } });
  await expect(page.locator('#game')).toHaveAttribute('data-scene', 'pause');
  await page.locator('canvas').click({ position: { x: 195, y: 378 } });
  await expect(page.locator('#game')).toHaveAttribute('data-scene', 'game');
  await expect(page.locator('#game')).toHaveAttribute('data-scene', 'gameover', { timeout: 20_000 });
  await page.screenshot({ path: 'test-results/gameover.png' });
  await page.locator('canvas').click({ position: { x: 112, y: 660 } });
  await expect(page.locator('#game')).toHaveAttribute('data-scene', 'leaderboard');
  await page.locator('canvas').click({ position: { x: 195, y: 755 } });
  await expect(page.locator('#game')).toHaveAttribute('data-scene', 'menu');
});

test('fits phone and tablet widths with a high density canvas', async ({ browser }) => {
  for (const viewport of [{ width: 360, height: 640 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: '儲存暱稱' }).click();
    await expect(page.locator('#game')).toHaveAttribute('data-scene', 'menu');
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    const backing = await canvas.evaluate(element => ({ width: element.width, height: element.height }));
    expect(box).not.toBeNull();
    expect(box!.width).toBeCloseTo(Math.min(viewport.width, 768), 0);
    expect(box!.height).toBeCloseTo(viewport.height, 0);
    expect(backing.width / box!.width).toBeGreaterThanOrEqual(1.95);
    expect(backing.height / box!.height).toBeGreaterThanOrEqual(1.95);
    if (viewport.width === 360) await page.screenshot({ path: 'test-results/phone-menu.png' });
    await canvas.click({ position: { x: box!.width / 2, y: 609 * box!.height / 844 } });
    await expect(page.locator('#game')).toHaveAttribute('data-scene', 'game');
    if (viewport.width === 768) {
      await page.screenshot({ path: 'test-results/tablet.png' });
      await page.setViewportSize({ width: 600, height: 900 });
      await expect(canvas).toHaveCSS('width', '600px');
      await expect(page.locator('#game')).toHaveAttribute('data-scene', 'game');
      await canvas.click({ position: { x: 538, y: 167 } });
      await expect(page.locator('#game')).toHaveAttribute('data-scene', 'pause');
      await canvas.click({ position: { x: 300, y: 403 } });
      await expect(page.locator('#game')).toHaveAttribute('data-scene', 'game');
    }
    await context.close();
  }
});

test('menu tiles open the redesigned settings and leaderboard', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '儲存暱稱' }).click();
  await expect(page.locator('#game')).toHaveAttribute('data-scene', 'menu');
  await page.screenshot({ path: 'test-results/menu-redesign.png' });
  await page.locator('canvas').click({ position: { x: 258, y: 700 } });
  await expect(page.locator('#game')).toHaveAttribute('data-scene', 'settings');
  await page.screenshot({ path: 'test-results/settings-redesign.png' });
  await page.locator('canvas').click({ position: { x: 285, y: 239 } });
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('cat-dash:settings:v1') || '{}').musicEnabled)).toBe(false);
  await page.locator('canvas').click({ position: { x: 195, y: 753 } });
  await expect(page.locator('#game')).toHaveAttribute('data-scene', 'menu');
  await page.locator('canvas').click({ position: { x: 132, y: 700 } });
  await expect(page.locator('#game')).toHaveAttribute('data-scene', 'leaderboard');
  await page.screenshot({ path: 'test-results/leaderboard-redesign.png' });
  await page.locator('canvas').click({ position: { x: 195, y: 760 } });
  await expect(page.locator('#game')).toHaveAttribute('data-scene', 'menu');
});
