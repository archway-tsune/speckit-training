/**
 * カタログドメイン - 購入者導線E2Eテスト
 * 商品一覧・詳細閲覧・未ログイン時の動作を検証
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

test.describe('購入者導線 - カタログ', () => {
  test.beforeEach(async ({ page, request }) => {
    // テスト前に状態をリセット
    await request.post('/sample/api/test/reset');
    // 購入者としてログイン
    await loginAsBuyer(page);
  });

  test.describe('商品一覧', () => {
    test('商品一覧ページが表示される', async ({ page }) => {
      await page.goto('/sample/catalog');

      // ページタイトルを確認
      await expect(page.locator('h1')).toContainText('商品');

      // 商品カードが表示される（デモデータ）
      await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
    });

    test('商品をクリックすると詳細ページに遷移する', async ({ page }) => {
      await page.goto('/sample/catalog');

      // 最初の商品カードをクリック
      await page.locator('[data-testid="product-card"]').first().click();

      // 詳細ページに遷移
      await expect(page).toHaveURL(/\/sample\/catalog\/[a-f0-9-]+/);
    });
  });

  test.describe('商品詳細', () => {
    test('商品詳細が表示される', async ({ page }) => {
      // デモ商品IDでアクセス（実際のIDに置き換え）
      await page.goto('/sample/catalog/550e8400-e29b-41d4-a716-446655440000');

      // 商品名が表示される
      await expect(page.locator('h1')).toBeVisible();

      // 価格が表示される
      await expect(page.locator('text=¥')).toBeVisible();

      // カートに追加ボタンが表示される
      await expect(page.getByRole('button', { name: /カートに追加/i })).toBeVisible();
    });

    test('カートに追加できる', async ({ page }) => {
      await page.goto('/sample/catalog/550e8400-e29b-41d4-a716-446655440000');

      // カートに追加
      await page.getByRole('button', { name: /カートに追加/i }).click();

      // 成功メッセージまたはカートアイコン更新を確認
      await expect(page.locator('[data-testid="cart-count"]')).toContainText(/[1-9]/);
    });
  });

  test.describe('未ログイン時の動作', () => {
    test('未ログインでカート追加するとログインページにリダイレクトされる', async ({ browser }) => {
      // 新しいコンテキストで未ログイン状態
      const newContext = await browser.newContext();
      const page = await newContext.newPage();

      // 商品詳細ページへ
      await page.goto('/sample/catalog/550e8400-e29b-41d4-a716-446655440000');

      // カートに追加
      await page.getByRole('button', { name: /カートに追加/i }).click();

      // ログインページにリダイレクト
      await expect(page).toHaveURL(/\/sample\/login/);

      await newContext.close();
    });
  });
});
