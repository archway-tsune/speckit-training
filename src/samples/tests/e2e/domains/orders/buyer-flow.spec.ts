/**
 * 注文ドメイン - 購入者導線E2Eテスト
 * 注文確定・履歴確認・一連の購入フローを検証
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

test.describe('購入者導線 - 注文', () => {
  test.beforeEach(async ({ page, request }) => {
    // テスト前に状態をリセット
    await request.post('/sample/api/test/reset');
    // 購入者としてログイン
    await loginAsBuyer(page);
  });

  test.describe('注文', () => {
    test('注文を確定できる', async ({ page }) => {
      // 商品一覧から開始
      await page.goto('/sample/catalog');
      await expect(page.locator('h1')).toContainText('商品');

      // 商品詳細へ
      await page.locator('[data-testid="product-card"]').first().click();
      await expect(page).toHaveURL(/\/sample\/catalog\/[a-f0-9-]+/);

      // カートに追加
      await page.getByRole('button', { name: /カートに追加/i }).click();
      await expect(page.locator('[data-testid="cart-count"]')).toBeVisible();

      // カートへ
      await page.goto('/sample/cart');
      await expect(page.locator('h1')).toContainText('カート');
      // カートに商品があることを確認
      await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible({ timeout: 10000 });

      // 注文手続きへ
      await page.getByRole('button', { name: /注文手続きへ/i }).click();
      await expect(page).toHaveURL(/\/sample\/checkout/);

      // 注文確定
      await page.getByRole('button', { name: /注文を確定/i }).click();

      // 注文完了ページに遷移
      await expect(page).toHaveURL(/\/sample\/orders\/[a-f0-9-]+/);

      // 注文完了メッセージ
      await expect(page.locator('text=ご注文ありがとうございます')).toBeVisible();
    });

    test('注文履歴ページで注文を確認できる', async ({ page }) => {
      await page.goto('/sample/orders');

      // 注文一覧が表示される
      await expect(page.locator('h1')).toContainText('注文');
    });

    test('注文詳細を確認できる', async ({ page }) => {
      // 商品一覧から開始
      await page.goto('/sample/catalog');
      await expect(page.locator('h1')).toContainText('商品');

      // 商品詳細へ
      await page.locator('[data-testid="product-card"]').first().click();
      await expect(page).toHaveURL(/\/sample\/catalog\/[a-f0-9-]+/);

      // カートに追加
      await page.getByRole('button', { name: /カートに追加/i }).click();
      await expect(page.locator('[data-testid="cart-count"]')).toBeVisible();

      // カートへ
      await page.goto('/sample/cart');
      await expect(page.locator('h1')).toContainText('カート');
      // カートに商品があることを確認
      await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible({ timeout: 10000 });

      // 注文手続きへ
      await page.getByRole('button', { name: /注文手続きへ/i }).click();
      await expect(page).toHaveURL(/\/sample\/checkout/);

      // 注文確定
      await page.getByRole('button', { name: /注文を確定/i }).click();
      await expect(page).toHaveURL(/\/sample\/orders\/[a-f0-9-]+/);

      // 注文一覧ページへ
      await page.goto('/sample/orders');
      await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible();

      // 最初の注文をクリック
      await page.locator('[data-testid="order-row"]').first().click();

      // 注文詳細ページ
      await expect(page.locator('h1')).toContainText('注文詳細');

      // 注文ステータスが表示される
      await expect(page.locator('[data-testid="order-status"]')).toBeVisible();
    });
  });

  test.describe('一連の購入フロー', () => {
    test('商品閲覧 → カート → 注文確定', async ({ page }) => {
      // 1. 商品一覧
      await page.goto('/sample/catalog');
      await expect(page.locator('h1')).toContainText('商品');

      // 2. 商品詳細（URLの変更を待つ）
      await page.locator('[data-testid="product-card"]').first().click();
      await expect(page).toHaveURL(/\/sample\/catalog\/[a-f0-9-]+/);
      await expect(page.locator('h1')).toBeVisible();

      // 3. カートに追加（詳細ページのボタンをクリック）
      await page.getByRole('button', { name: /カートに追加/i }).click();
      await expect(page.locator('[data-testid="cart-count"]')).toBeVisible();

      // 4. カートへ
      await page.goto('/sample/cart');
      await expect(page.locator('h1')).toContainText('カート');
      // カートに商品があることを確認
      await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible({ timeout: 10000 });

      // 5. 注文手続きへ
      await page.getByRole('button', { name: /注文手続きへ/i }).click();
      await expect(page).toHaveURL(/\/sample\/checkout/);

      // 6. 注文確定
      await page.getByRole('button', { name: /注文を確定/i }).click();

      // 7. 注文完了
      await expect(page.locator('text=ご注文ありがとうございます')).toBeVisible();
    });
  });
});
