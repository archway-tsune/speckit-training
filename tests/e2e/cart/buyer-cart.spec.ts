/**
 * 購入者カート管理 E2E テスト
 * ユーザーストーリー1-5 + ナビゲーション
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────────
// ヘルパー: 購入者ログイン
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

// ─────────────────────────────────────────────────────────────────
// US1: カートに商品を追加
// ─────────────────────────────────────────────────────────────────

test.describe('US1: カートに商品を追加', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestData(page);
    await loginAsBuyer(page);
  });

  test('商品詳細ページで「カートに追加」ボタンをクリックすると成功メッセージが表示されること', async ({ page }) => {
    // 商品一覧から最初の商品の詳細ページへ
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await expect(page).toHaveURL(/\/catalog\/.+/);

    // カートに追加
    await page.getByRole('button', { name: 'カートに追加' }).click();

    // 成功メッセージが表示される
    await expect(page.getByText('カートに追加しました')).toBeVisible();
  });

  test('在庫切れ商品では「カートに追加」ボタンが無効であること', async ({ page }) => {
    // ウールニット (stock: 0) の詳細ページへ直接
    await page.goto(`${BASE_URL}/catalog/550e8400-e29b-41d4-a716-446655440004`);
    await expect(page.getByText('在庫切れ')).toBeVisible();

    const addButton = page.getByRole('button', { name: 'カートに追加' });
    await expect(addButton).toBeDisabled();
  });
});

// ─────────────────────────────────────────────────────────────────
// US2: カート内容の確認
// ─────────────────────────────────────────────────────────────────

test.describe('US2: カート内容の確認', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestData(page);
    await loginAsBuyer(page);
  });

  test('カートに追加した商品がカートページに表示されること', async ({ page }) => {
    // E2Eテスト商品 (¥3,000) をカートに追加
    await page.goto(`${BASE_URL}/catalog/550e8400-e29b-41d4-a716-446655440000`);
    await page.getByRole('button', { name: 'カートに追加' }).click();
    await expect(page.getByText('カートに追加しました')).toBeVisible();

    // カートページへ
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByText('E2Eテスト商品')).toBeVisible();
    await expect(page.getByTestId('cart-item-subtotal')).toHaveText('¥3,000');
  });

  test('空カートで「カートに商品がありません」メッセージが表示されること', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByText('カートに商品がありません')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// US3: 数量変更
// ─────────────────────────────────────────────────────────────────

test.describe('US3: 数量変更', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestData(page);
    await loginAsBuyer(page);
    // E2Eテスト商品をカートに追加
    await page.goto(`${BASE_URL}/catalog/550e8400-e29b-41d4-a716-446655440000`);
    await page.getByRole('button', { name: 'カートに追加' }).click();
    await expect(page.getByText('カートに追加しました')).toBeVisible();
  });

  test('数量を増やすと小計が更新されること', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByText('E2Eテスト商品')).toBeVisible();

    // + ボタンで数量を増やす
    await page.getByTestId('quantity-increment').click();
    await page.waitForTimeout(500);

    // 小計が更新される (3000 * 2 = 6000)
    await expect(page.getByTestId('cart-item-subtotal')).toHaveText('¥6,000');
  });
});

// ─────────────────────────────────────────────────────────────────
// US4: 商品の削除
// ─────────────────────────────────────────────────────────────────

test.describe('US4: 商品の削除', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestData(page);
    await loginAsBuyer(page);
    // E2Eテスト商品をカートに追加
    await page.goto(`${BASE_URL}/catalog/550e8400-e29b-41d4-a716-446655440000`);
    await page.getByRole('button', { name: 'カートに追加' }).click();
    await expect(page.getByText('カートに追加しました')).toBeVisible();
  });

  test('削除ボタン → 確認ダイアログ → 削除実行で商品が消えること', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByText('E2Eテスト商品')).toBeVisible();

    // 削除ボタンをクリック
    await page.getByRole('button', { name: /削除/ }).click();

    // 確認ダイアログが表示される
    await expect(page.getByTestId('confirm-dialog')).toBeVisible();

    // 「削除する」をクリック
    await page.getByTestId('confirm-button').click();
    await page.waitForTimeout(500);

    // 商品が消え、空状態メッセージが表示される
    await expect(page.getByText('カートに商品がありません')).toBeVisible();
  });

  test('確認ダイアログで「キャンセル」すると商品が残ること', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByText('E2Eテスト商品')).toBeVisible();

    // 削除ボタンをクリック
    await page.getByRole('button', { name: /削除/ }).click();

    // 確認ダイアログで「キャンセル」
    await page.getByTestId('cancel-button').click();

    // 商品が残っている
    await expect(page.getByText('E2Eテスト商品')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// US5: カート内容の永続化
// ─────────────────────────────────────────────────────────────────

test.describe('US5: カート内容の永続化', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestData(page);
    await loginAsBuyer(page);
  });

  test('ページ遷移後もカート内容が保持されること', async ({ page }) => {
    // 商品をカートに追加
    await page.goto(`${BASE_URL}/catalog/550e8400-e29b-41d4-a716-446655440000`);
    await page.getByRole('button', { name: 'カートに追加' }).click();
    await expect(page.getByText('カートに追加しました')).toBeVisible();

    // 別ページに遷移
    await page.goto(`${BASE_URL}/catalog`);
    await expect(page.getByText('商品一覧')).toBeVisible();

    // カートページに戻る
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByText('E2Eテスト商品')).toBeVisible();
  });

  test('リロード後もカート内容が保持されること', async ({ page }) => {
    // 商品をカートに追加
    await page.goto(`${BASE_URL}/catalog/550e8400-e29b-41d4-a716-446655440000`);
    await page.getByRole('button', { name: 'カートに追加' }).click();
    await expect(page.getByText('カートに追加しました')).toBeVisible();

    // カートページへ
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByText('E2Eテスト商品')).toBeVisible();

    // リロード
    await page.reload();
    await expect(page.getByText('E2Eテスト商品')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// ナビゲーション
// ─────────────────────────────────────────────────────────────────

test.describe('ナビゲーション', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestData(page);
    await loginAsBuyer(page);
  });

  test('ヘッダーに「カート」リンクが表示され、クリックで /cart に遷移すること', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    const cartLink = page.getByRole('navigation').getByRole('link', { name: 'カート' }).first();
    await expect(cartLink).toBeVisible();
    await cartLink.click();
    await expect(page).toHaveURL(/\/cart/);
  });
});
