/**
 * 購入者チェックアウト E2E テスト
 * US1: チェックアウトと注文確定
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

async function addProductToCart(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/catalog`);
  await page.waitForSelector('[data-testid="product-card"]');
  await page.locator('[data-testid="product-card"]').first().click();
  await expect(page).toHaveURL(/\/catalog\/.+/);
  await page.getByRole('button', { name: 'カートに追加' }).click();
  await expect(page.getByText('カートに追加しました')).toBeVisible();
}

// ─────────────────────────────────────────────────────────────────
// US1: チェックアウトと注文確定
// ─────────────────────────────────────────────────────────────────

test.describe('US1: チェックアウトと注文確定', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestData(page);
    await loginAsBuyer(page);
  });

  test('カートに商品追加 → チェックアウト画面で商品一覧・合計金額表示 → 注文確定 → 完了画面', async ({ page }) => {
    // 商品をカートに追加
    await addProductToCart(page);

    // チェックアウト画面に遷移
    await page.goto(`${BASE_URL}/checkout`);

    // 商品一覧と合計金額が表示されていること
    await expect(page.getByText('注文確認')).toBeVisible();
    await expect(page.getByTestId('cart-subtotal')).toBeVisible();

    // 注文確定ボタンをクリック
    await page.getByRole('button', { name: '注文を確定' }).click();

    // 注文完了画面にリダイレクト
    await page.waitForURL(/\/orders\/.+\?completed=true/);

    // 注文完了メッセージが表示されること
    await expect(page.getByText(/ご注文ありがとうございます|注文が完了/)).toBeVisible();
  });

  test('注文確定後にカートが空になっていること', async ({ page }) => {
    await addProductToCart(page);

    // チェックアウト → 注文確定
    await page.goto(`${BASE_URL}/checkout`);
    await page.getByRole('button', { name: '注文を確定' }).click();
    await page.waitForURL(/\/orders\/.+/);

    // カートページに遷移
    await page.goto(`${BASE_URL}/cart`);

    // カートが空であること
    await expect(page.getByText(/カートは空|商品がありません/)).toBeVisible();
  });

  test('カートが空の場合チェックアウト画面から注文確定できないこと', async ({ page }) => {
    // カートが空の状態でチェックアウト画面に遷移
    await page.goto(`${BASE_URL}/checkout`);

    // 空のカートではカートページにリダイレクトされるか、注文確定ボタンが非表示
    // 既存実装: カート空の場合は /cart にリダイレクト
    await page.waitForURL(/\/(cart|checkout)/);

    const submitButton = page.getByRole('button', { name: '注文を確定' });
    const isVisible = await submitButton.isVisible().catch(() => false);
    if (isVisible) {
      // ボタンが見えている場合は disabled であるべき
      await expect(submitButton).toBeDisabled();
    }
    // ボタンが見えない場合はそれで OK（リダイレクトされた）
  });
});
