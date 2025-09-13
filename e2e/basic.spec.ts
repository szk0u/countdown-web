import { test, expect } from '@playwright/test';

test('トップページに月末のカウンターが表示される', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('月末')).toBeVisible();
});
