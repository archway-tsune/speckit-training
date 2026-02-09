/**
 * 注文機能 - 管理者導線E2Eテスト
 * 注文管理・ステータス更新・アクセス制御を検証
 */
import { test, expect } from '@playwright/test';

// 購入者ログイン
async function loginAsBuyer(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.locator('#email').fill('buyer@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL('/catalog');
  await page.waitForLoadState('networkidle');
}

// 管理者ログイン
async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.locator('#email').fill('admin@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/admin/);
  await page.waitForLoadState('networkidle');
}

// 購入者として注文を作成するヘルパー
async function createOrderAsBuyer(page: import('@playwright/test').Page, productId: string) {
  await loginAsBuyer(page);
  await page.goto(`/catalog/${productId}`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /カートに追加/i }).click();
  await expect(page.locator('text=カートに追加しました')).toBeVisible({ timeout: 10000 });

  await page.goto('/cart');
  await page.waitForLoadState('networkidle');
  await page.getByRole('link', { name: /注文手続きへ/ }).click();
  await page.waitForURL('/checkout');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /注文を確定/ }).click();
  await page.waitForURL(/\/order-complete/);

  // ログアウト
  await page.goto('/api/auth/logout');
  await page.waitForLoadState('networkidle');
}

test.describe('管理者導線 - 注文管理', () => {
  const testProductId = '550e8400-e29b-41d4-a716-446655440000';

  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test.describe('注文一覧', () => {
    test('管理者が全注文を確認できる', async ({ page }) => {
      // 購入者として注文を作成
      await createOrderAsBuyer(page, testProductId);

      // 管理者としてログイン
      await loginAsAdmin(page);

      // 注文管理ページに遷移
      await page.goto('/admin/orders');
      await page.waitForLoadState('networkidle');

      // 注文が表示される
      await expect(page.locator('text=1点の商品')).toBeVisible();
      await expect(page.locator('span:text("保留中")')).toBeVisible();
    });

    test('ステータスで絞り込みができる', async ({ page }) => {
      // 購入者として注文を作成
      await createOrderAsBuyer(page, testProductId);

      // 管理者としてログイン
      await loginAsAdmin(page);

      // 「保留中」で絞り込み
      await page.goto('/admin/orders');
      await page.waitForLoadState('networkidle');
      await page.selectOption('select', 'pending');
      await page.waitForLoadState('networkidle');

      // 保留中の注文が表示される
      await expect(page.locator('span:text("保留中")')).toBeVisible();
    });
  });

  test.describe('ステータス更新', () => {
    test('pending → confirmed → shipped → delivered の順で更新できる', async ({ page }) => {
      // 購入者として注文を作成
      await createOrderAsBuyer(page, testProductId);

      // 管理者としてログイン
      await loginAsAdmin(page);

      // 注文管理ページに遷移
      await page.goto('/admin/orders');
      await page.waitForLoadState('networkidle');

      // 注文をクリック
      await page.locator('a').filter({ hasText: '1点の商品' }).first().click();
      await page.waitForURL(/\/admin\/orders\//);
      await page.waitForLoadState('networkidle');

      // pending → confirmed
      await page.getByRole('button', { name: /確認済み/ }).click();
      await expect(page.locator('text=ステータスを「確認済み」に更新しました')).toBeVisible({ timeout: 10000 });

      // confirmed → shipped
      await page.getByRole('button', { name: /発送済み/ }).click();
      await expect(page.locator('text=ステータスを「発送済み」に更新しました')).toBeVisible({ timeout: 10000 });

      // shipped → delivered
      await page.getByRole('button', { name: /配送完了/ }).click();
      await expect(page.locator('text=ステータスを「配送完了」に更新しました')).toBeVisible({ timeout: 10000 });

      // 配送完了後はステータス変更ボタンが非表示
      await expect(page.getByRole('button', { name: /確認済み/ })).not.toBeVisible();
      await expect(page.getByRole('button', { name: /キャンセル/ })).not.toBeVisible();
    });
  });

  test.describe('アクセス制御', () => {
    test('購入者が管理者の注文管理ページにアクセスできない', async ({ page }) => {
      await loginAsBuyer(page);
      await page.goto('/admin/orders');
      await page.waitForLoadState('networkidle');

      // 権限がありませんメッセージまたはログインページにリダイレクト
      const denied = page.locator('text=権限がありません');
      const loginPage = page.locator('#email');
      await expect(denied.or(loginPage)).toBeVisible({ timeout: 10000 });
    });
  });
});
