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
