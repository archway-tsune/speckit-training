/**
 * 商品管理機能 - 購入者アクセス拒否E2Eテスト
 * buyer ロールでの /admin/products アクセス拒否を検証
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

test.describe('購入者アクセス制御 - 商品管理', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('購入者が管理者の商品管理ページにアクセスできない', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');

    // 権限がありませんメッセージまたはログインページにリダイレクト
    const denied = page.locator('text=権限がありません');
    const loginPage = page.locator('#email');
    await expect(denied.or(loginPage)).toBeVisible({ timeout: 10000 });
  });

  test('購入者が商品管理APIにアクセスできない', async ({ page }) => {
    await loginAsBuyer(page);

    // API経由でも拒否される
    const res = await page.evaluate(async () => {
      const response = await fetch('/api/products');
      return { status: response.status, body: await response.json() };
    });

    expect(res.status).toBe(403);
  });
});
