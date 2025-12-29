import { test, expect } from '@playwright/test';

test.describe('カウントダウンアプリ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ページが正しく読み込まれる', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('カウントダウン');
  });

  test('デフォルトのカウントダウンカードが表示される', async ({ page }) => {
    await expect(page.getByText('月末')).toBeVisible();
    await expect(page.getByText('四半期末')).toBeVisible();
    await expect(page.getByText('半期末')).toBeVisible();
    await expect(page.getByText('年度末')).toBeVisible();
  });

  test('ダークモード切り替えが機能する', async ({ page }) => {
    const html = page.locator('html');

    // 初期状態を確認
    const initialDark = await html.evaluate((el) => el.classList.contains('dark'));

    // ダークモードボタンをクリック
    await page.getByRole('button', { name: /ライト|ダーク/ }).click();

    // クラスが切り替わったことを確認
    const afterClick = await html.evaluate((el) => el.classList.contains('dark'));
    expect(afterClick).toBe(!initialDark);
  });

  test('シンプルモード切り替えが機能する', async ({ page }) => {
    // 初期状態（詳細モード）では時間・分・秒が表示される
    await expect(page.getByText('時間').first()).toBeVisible();
    await expect(page.getByText('分').first()).toBeVisible();
    await expect(page.getByText('秒').first()).toBeVisible();

    // シンプルボタンをクリック
    await page.getByRole('button', { name: 'シンプル' }).click();

    // シンプルモードでは時間・分・秒が非表示になる
    await expect(page.getByText('時間').first()).not.toBeVisible();
  });

  test('カスタムターゲットを追加できる', async ({ page }) => {
    // 新規追加ボタンをクリック
    await page.getByRole('button', { name: '新規追加' }).click();

    // フォームが表示されることを確認
    await expect(page.getByPlaceholder('イベント名')).toBeVisible();

    // イベント名と日付を入力
    await page.getByPlaceholder('イベント名').fill('テストイベント');

    // 未来の日付を設定
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    const dateString = futureDate.toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(dateString);

    // 保存ボタンをクリック
    await page.getByRole('button', { name: '保存' }).click();

    // カスタムターゲットが追加されたことを確認
    await expect(page.getByText('テストイベント')).toBeVisible();
  });

  test('カスタムターゲットを削除できる', async ({ page }) => {
    // まずカスタムターゲットを追加
    await page.getByRole('button', { name: '新規追加' }).click();
    await page.getByPlaceholder('イベント名').fill('削除用イベント');

    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    const dateString = futureDate.toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(dateString);
    await page.getByRole('button', { name: '保存' }).click();

    // カスタムターゲットが表示されることを確認
    await expect(page.getByText('削除用イベント')).toBeVisible();

    // 再度フォームを開いて削除ボタンをクリック
    await page.getByRole('button', { name: '新規追加' }).click();
    await page.getByRole('button', { name: '削除' }).click();

    // カスタムターゲットが削除されたことを確認
    await expect(page.getByText('削除用イベント')).not.toBeVisible();
  });

  test('URLパラメータでダークモードを設定できる', async ({ page }) => {
    await page.goto('/?dark=true');
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.goto('/?dark=false');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('URLパラメータでカスタムターゲットを設定できる', async ({ page }) => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);
    const dateString = futureDate.toISOString().split('T')[0];

    await page.goto(`/?name=URLテスト&date=${dateString}`);
    await expect(page.getByText('URLテスト')).toBeVisible();
  });
});
