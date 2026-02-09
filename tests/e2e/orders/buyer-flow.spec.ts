/**
 * 注文機能 - 購入者導線E2Eテスト
 * チェックアウト→注文確定→注文完了→注文履歴→注文詳細を検証
 */
import { test, expect } from '@playwright/test';

// ログインヘルパー
async function loginAsBuyer(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.locator('#email').fill('buyer@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL('/catalog');
  await page.waitForLoadState('networkidle');
}

// カートに商品を追加するヘルパー
async function addProductToCart(page: import('@playwright/test').Page, productId: string) {
  await page.goto(`/catalog/${productId}`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /カートに追加/i }).click();
  await expect(page.locator('text=カートに追加しました')).toBeVisible({ timeout: 10000 });
}

test.describe('購入者導線 - 注文管理', () => {
  const testProductId = '550e8400-e29b-41d4-a716-446655440000';

  test.beforeEach(async ({ page, request }) => {
    await request.post('/api/test/reset');
    await loginAsBuyer(page);
  });

  test.describe('チェックアウトフロー', () => {
    test('カートから注文を確定し、注文完了画面が表示される', async ({ page }) => {
      // 1. 商品をカートに追加
      await addProductToCart(page, testProductId);

      // 2. カートページへ遷移
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');

      // 3. 「注文手続きへ」ボタンが表示される
      const checkoutLink = page.getByRole('link', { name: /注文手続きへ/ });
      await expect(checkoutLink).toBeVisible();

      // 4. チェックアウト画面に遷移
      await checkoutLink.click();
      await page.waitForURL('/checkout');
      await page.waitForLoadState('networkidle');

      // 5. チェックアウト画面で注文内容を確認
      await expect(page.locator('text=E2Eテスト商品')).toBeVisible();
      await expect(page.locator('text=注文内容の確認')).toBeVisible();

      // 6. 「注文を確定」ボタンをクリック
      await page.getByRole('button', { name: /注文を確定/ }).click();

      // 7. 注文完了画面に遷移
      await page.waitForURL(/\/order-complete/);
      await expect(page.locator('text=ご注文ありがとうございます')).toBeVisible();

      // 8. 注文IDが表示される
      await expect(page.locator('text=注文ID:')).toBeVisible();
    });

    test('注文後にカートが空になる', async ({ page }) => {
      // 商品をカートに追加して注文
      await addProductToCart(page, testProductId);
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');
      await page.getByRole('link', { name: /注文手続きへ/ }).click();
      await page.waitForURL('/checkout');
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: /注文を確定/ }).click();
      await page.waitForURL(/\/order-complete/);

      // カートページに戻る
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');

      // カートが空であることを確認
      await expect(page.locator('text=カートに商品がありません')).toBeVisible();
    });

    test('空カート時は「注文手続きへ」ボタンが非表示', async ({ page }) => {
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');

      // カートが空の状態
      await expect(page.locator('text=カートに商品がありません')).toBeVisible();
      await expect(page.getByRole('link', { name: /注文手続きへ/ })).not.toBeVisible();
    });
  });

  test.describe('注文履歴', () => {
    test('注文後に注文履歴に表示される', async ({ page }) => {
      // 注文を作成
      await addProductToCart(page, testProductId);
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');
      await page.getByRole('link', { name: /注文手続きへ/ }).click();
      await page.waitForURL('/checkout');
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: /注文を確定/ }).click();
      await page.waitForURL(/\/order-complete/);

      // 注文履歴ページへ遷移
      await page.goto('/orders');
      await page.waitForLoadState('networkidle');

      // 注文が表示される
      await expect(page.locator('text=1点の商品')).toBeVisible();
      await expect(page.locator('text=保留中')).toBeVisible();
    });

    test('注文詳細で情報を確認できる', async ({ page }) => {
      // 注文を作成
      await addProductToCart(page, testProductId);
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');
      await page.getByRole('link', { name: /注文手続きへ/ }).click();
      await page.waitForURL('/checkout');
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: /注文を確定/ }).click();
      await page.waitForURL(/\/order-complete/);

      // 注文履歴ページへ遷移
      await page.goto('/orders');
      await page.waitForLoadState('networkidle');

      // 注文をクリック
      await page.locator('a').filter({ hasText: '1点の商品' }).first().click();
      await page.waitForURL(/\/orders\//);
      await page.waitForLoadState('networkidle');

      // 注文詳細が表示される
      await expect(page.locator('text=注文詳細')).toBeVisible();
      await expect(page.locator('text=E2Eテスト商品')).toBeVisible();
      await expect(page.locator('text=保留中')).toBeVisible();
    });
  });
});
