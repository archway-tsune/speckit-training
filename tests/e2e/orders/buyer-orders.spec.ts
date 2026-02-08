/**
 * 購入者注文履歴 E2E テスト
 * US2: 注文履歴・注文詳細
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────────────────────────────────

async function loginAsBuyer(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel('メールアドレス').fill('buyer@example.com');
  await page.getByLabel('パスワード').fill('password');
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForURL(/\/catalog/);
}

async function resetTestData(page: import('@playwright/test').Page) {
  await page.request.post(`${BASE_URL}/api/test/reset`);
}

async function createOrderViaBuyer(page: import('@playwright/test').Page) {
  // 商品をカートに追加
  await page.goto(`${BASE_URL}/catalog`);
  await page.waitForSelector('[data-testid="product-card"]');
  await page.locator('[data-testid="product-card"]').first().click();
  await expect(page).toHaveURL(/\/catalog\/.+/);
  await page.getByRole('button', { name: 'カートに追加' }).click();
  await expect(page.getByText('カートに追加しました')).toBeVisible();

  // チェックアウト → 注文確定
  await page.goto(`${BASE_URL}/checkout`);
  await page.getByRole('button', { name: '注文を確定' }).click();
  await page.waitForURL(/\/orders\/.+/);
}

// ─────────────────────────────────────────────────────────────────
// US2: 注文履歴・注文詳細
// ─────────────────────────────────────────────────────────────────

test.describe('US2: 注文履歴・注文詳細', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestData(page);
    await loginAsBuyer(page);
  });

  test('注文一覧ページで注文が表示されること', async ({ page }) => {
    // 注文を作成
    await createOrderViaBuyer(page);

    // 注文一覧ページに遷移
    await page.goto(`${BASE_URL}/orders`);

    // 注文が表示されること
    await expect(page.getByTestId('order-row').first()).toBeVisible();
  });

  test('注文クリックで詳細画面に遷移すること', async ({ page }) => {
    await createOrderViaBuyer(page);

    await page.goto(`${BASE_URL}/orders`);
    await page.getByTestId('order-row').first().click();

    // 注文詳細画面に遷移
    await expect(page).toHaveURL(/\/orders\/.+/);
    await expect(page.getByText('注文詳細')).toBeVisible();
  });

  test('注文0件で空メッセージが表示されること', async ({ page }) => {
    await page.goto(`${BASE_URL}/orders`);

    await expect(page.getByText(/注文履歴がありません/)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// ナビゲーション (T038)
// ─────────────────────────────────────────────────────────────────

test.describe('ナビゲーション: 注文履歴リンク', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestData(page);
    await loginAsBuyer(page);
  });

  test('ヘッダーに「注文履歴」リンクが表示され、クリックで /orders に遷移すること', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);

    const orderLink = page.getByRole('link', { name: '注文履歴' });
    await expect(orderLink).toBeVisible();
    await orderLink.click();
    await expect(page).toHaveURL(/\/orders/);
  });
});
