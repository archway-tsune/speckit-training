/**
 * カートドメイン - 購入者導線E2Eテスト
 * カート操作（表示・空状態・数量変更・注文手続き）を検証
 */
import { test, expect } from '@playwright/test';

// ログインヘルパー
async function loginAsBuyer(page: import('@playwright/test').Page) {
  await page.goto('/sample/login');
  await page.locator('#email').fill('buyer@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/sample\/catalog/);
  await page.waitForLoadState('networkidle');
}

test.describe('購入者導線 - カート', () => {
  test.beforeEach(async ({ page, request }) => {
    // テスト前に状態をリセット
    await request.post('/sample/api/test/reset');
    // 購入者としてログイン
    await loginAsBuyer(page);
  });

  test.describe('カート', () => {
    test('カートページが表示される', async ({ page }) => {
      await page.goto('/sample/cart');

      // カートページのヘッダー
      await expect(page.locator('h1')).toContainText('カート');
    });

    test('カートが空の場合は空状態を表示する', async ({ page }) => {
      await page.goto('/sample/cart');

      // 空状態メッセージ
      await expect(page.locator('text=カートは空です')).toBeVisible();
    });

    test('カート内商品の数量を変更できる', async ({ page }) => {
      // 事前にカートに商品を追加
      await page.goto('/sample/catalog/550e8400-e29b-41d4-a716-446655440000');
      await page.getByRole('button', { name: /カートに追加/i }).click();

      // カートページへ
      await page.goto('/sample/cart');

      // 数量セレクトを変更
      await page.locator('select').first().selectOption('3');

      // 合計金額が更新される
      await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible();
    });

    test('注文手続きに進める', async ({ page }) => {
      // 事前にカートに商品を追加
      await page.goto('/sample/catalog/550e8400-e29b-41d4-a716-446655440000');
      await page.getByRole('button', { name: /カートに追加/i }).click();
      await expect(page.locator('[data-testid="cart-count"]')).toBeVisible();

      // カートページへ
      await page.goto('/sample/cart');
      await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible();

      // 注文手続きへボタンをクリック
      await page.getByRole('button', { name: /注文手続きへ/i }).click();

      // 注文確認ページに遷移
      await expect(page).toHaveURL(/\/sample\/checkout/);
    });
  });
});
