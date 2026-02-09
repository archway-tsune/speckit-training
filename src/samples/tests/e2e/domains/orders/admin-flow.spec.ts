/**
 * 注文ドメイン - 管理者導線E2Eテスト
 * 注文一覧・詳細・ステータス更新を検証
 */
import { test, expect } from '@playwright/test';

// 管理者ログインヘルパー
async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/sample/admin/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill('admin@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/sample\/admin(?!\/login)/);
  await page.waitForLoadState('networkidle');
}

// 購入者ログインヘルパー
async function loginAsBuyer(page: import('@playwright/test').Page) {
  await page.goto('/sample/login');
  await page.locator('#email').fill('buyer@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/sample\/catalog/);
  await page.waitForLoadState('networkidle');
}

// 注文が存在する状態を作るためのヘルパー
async function createOrderAsBuyer(page: import('@playwright/test').Page) {
  // buyerとしてログイン
  await loginAsBuyer(page);

  // 商品をカートに追加して注文
  await page.goto('/sample/catalog');
  await expect(page.locator('h1')).toContainText('商品');
  await page.locator('[data-testid="product-card"]').first().click();
  await expect(page).toHaveURL(/\/sample\/catalog\/[a-f0-9-]+/);
  await page.getByRole('button', { name: /カートに追加/i }).click();
  await expect(page.locator('[data-testid="cart-count"]')).toBeVisible();
  await page.goto('/sample/cart');
  await expect(page.locator('h1')).toContainText('カート');
  // カートに商品があることを確認
  await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /注文手続きへ/i }).click();
  await expect(page).toHaveURL(/\/sample\/checkout/);
  await page.getByRole('button', { name: /注文を確定/i }).click();
  await expect(page).toHaveURL(/\/sample\/orders\//);
}

test.describe('管理者導線 - 注文', () => {
  test.beforeEach(async ({ page, request }) => {
    // テスト前に状態をリセット
    await request.post('/sample/api/test/reset');

    // 管理者としてログイン
    await loginAsAdmin(page);
  });

  test.describe('注文管理', () => {
    test('注文一覧が表示される', async ({ page }) => {
      // まずbuyerとして注文を作成
      await createOrderAsBuyer(page);

      // 再度adminとしてログイン
      await loginAsAdmin(page);

      await page.goto('/sample/admin/orders');

      // 注文一覧テーブル
      await expect(page.locator('table')).toBeVisible();
      await expect(page.locator('[data-testid="order-row"]').first()).toBeVisible();
    });

    test('注文詳細を確認できる', async ({ page }) => {
      // まずbuyerとして注文を作成
      await createOrderAsBuyer(page);

      // 再度adminとしてログイン
      await loginAsAdmin(page);

      await page.goto('/sample/admin/orders');

      // 注文行をクリック
      await page.locator('[data-testid="order-row"]').first().click();

      // 注文詳細ページ（メインコンテンツ内のh1を確認）
      await expect(page.locator('main h1')).toContainText('注文詳細');

      // 顧客情報
      await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();

      // 商品一覧
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
    });

    test('注文ステータスを更新できる', async ({ page }) => {
      // まずbuyerとして注文を作成
      await createOrderAsBuyer(page);

      // 再度adminとしてログイン
      await loginAsAdmin(page);

      await page.goto('/sample/admin/orders');

      // 注文詳細へ
      await page.locator('[data-testid="order-row"]').first().click();

      // ステータス変更
      await page.locator('[data-testid="status-select"]').selectOption('confirmed');

      // 更新ボタン
      await page.getByRole('button', { name: /ステータス更新/i }).click();

      // 成功メッセージ
      await expect(page.locator('text=ステータスを更新しました')).toBeVisible();
    });

    test('ステータスフィルタで絞り込める', async ({ page }) => {
      // まずbuyerとして注文を作成
      await createOrderAsBuyer(page);

      // 再度adminとしてログイン
      await loginAsAdmin(page);

      await page.goto('/sample/admin/orders');

      // フィルタ選択
      await page.locator('[data-testid="status-filter"]').selectOption('pending');

      // フィルタ適用後の結果
      await expect(page.locator('[data-testid="order-status"]').first()).toContainText('処理待ち');
    });
  });
});
