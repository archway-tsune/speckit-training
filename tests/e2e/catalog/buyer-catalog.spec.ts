/**
 * 購入者カタログ閲覧 E2E テスト
 * ユーザーストーリー1-3 + ナビゲーション
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────────
// US1: 商品一覧の閲覧
// ─────────────────────────────────────────────────────────────────

test.describe('商品一覧', () => {
  test('商品カードが表示されること', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForSelector('[data-testid="product-card"]');
    const cards = await page.locator('[data-testid="product-card"]').count();
    expect(cards).toBeGreaterThan(0);
  });

  test('12件を超える場合ページネーションが表示されること', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForSelector('[data-testid="product-card"]');
    const cards = await page.locator('[data-testid="product-card"]').count();
    expect(cards).toBeLessThanOrEqual(12);

    // 15件以上の published 商品があるためページネーションが表示される
    await expect(page.getByText('次へ')).toBeVisible();
  });

  test('「次へ」ボタンで2ページ目に遷移できること', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForSelector('[data-testid="product-card"]');

    const firstPageText = await page.locator('[data-testid="product-card"]').first().textContent();
    await page.getByText('次へ').click();
    await page.waitForTimeout(500);

    const secondPageText = await page.locator('[data-testid="product-card"]').first().textContent();
    expect(firstPageText).not.toBe(secondPageText);
  });

  test('在庫0の商品に「在庫切れ」が表示されること', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForSelector('[data-testid="product-card"]');
    await expect(page.getByText('在庫切れ').first()).toBeVisible();
  });

  test('認証なしでアクセス可能であること', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/catalog`);
    expect(response?.status()).toBe(200);
    await page.waitForSelector('[data-testid="product-card"]');
  });
});

// ─────────────────────────────────────────────────────────────────
// US2: 商品詳細の確認
// ─────────────────────────────────────────────────────────────────

test.describe('商品詳細', () => {
  test('一覧から商品をクリックすると詳細ページに遷移すること', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await expect(page).toHaveURL(/\/catalog\/.+/);
  });

  test('詳細ページに商品情報が表示されること', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await expect(page).toHaveURL(/\/catalog\/.+/);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText(/¥[\d,]+/).first()).toBeVisible();
  });

  test('戻るボタンで一覧に戻れること', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await expect(page).toHaveURL(/\/catalog\/.+/);

    await page.getByText('戻る').click();
    await expect(page).toHaveURL(/\/catalog$/);
  });
});

// ─────────────────────────────────────────────────────────────────
// US3: 商品検索
// ─────────────────────────────────────────────────────────────────

test.describe('商品検索', () => {
  test('キーワード検索で結果が絞り込まれること', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForSelector('[data-testid="product-card"]');

    const beforeCount = await page.locator('[data-testid="product-card"]').count();
    await page.getByTestId('search-input').fill('Tシャツ');
    await page.getByTestId('search-input').press('Enter');
    await page.waitForTimeout(500);

    const afterCount = await page.locator('[data-testid="product-card"]').count();
    expect(afterCount).toBeLessThan(beforeCount);
    expect(afterCount).toBeGreaterThan(0);
  });

  test('該当なしの場合メッセージが表示されること', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForSelector('[data-testid="product-card"]');

    await page.getByTestId('search-input').fill('存在しない商品名XYZ999');
    await page.getByTestId('search-input').press('Enter');
    await page.waitForTimeout(500);

    await expect(page.getByText('該当する商品が見つかりませんでした')).toBeVisible();
  });

  test('クリアボタンで全商品一覧に戻ること', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForSelector('[data-testid="product-card"]');

    await page.getByTestId('search-input').fill('Tシャツ');
    await page.getByTestId('search-input').press('Enter');
    await page.waitForTimeout(500);

    await page.getByTestId('search-clear').click();
    await page.waitForTimeout(500);

    const cards = await page.locator('[data-testid="product-card"]').count();
    expect(cards).toBeGreaterThan(2);
  });
});

// ─────────────────────────────────────────────────────────────────
// ナビゲーション
// ─────────────────────────────────────────────────────────────────

test.describe('ナビゲーション', () => {
  test('ヘッダーに「商品一覧」リンクが表示されること', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await expect(page.getByRole('link', { name: '商品一覧' })).toBeVisible();
  });

  test('「商品一覧」リンクで /catalog に遷移すること', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.getByRole('link', { name: '商品一覧' }).click();
    await expect(page).toHaveURL(/\/catalog/);
  });
});
