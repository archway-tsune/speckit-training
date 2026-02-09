/**
 * カート管理機能 - 購入者導線E2Eテスト
 * カート追加・表示・数量変更・削除・永続化を検証
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

test.describe('購入者導線 - カート管理', () => {
  test.beforeEach(async ({ page, request }) => {
    // テスト前に状態をリセット
    await request.post('/api/test/reset');
    // 購入者としてログイン
    await loginAsBuyer(page);
  });

  // E2Eテスト商品: id=550e8400-e29b-41d4-a716-446655440000, name="E2Eテスト商品", price=3000, stock=10
  const testProductId = '550e8400-e29b-41d4-a716-446655440000';

  test.describe('US1: カートに商品を追加する', () => {
    test('商品詳細ページからカートに追加できる', async ({ page }) => {
      await page.goto(`/catalog/${testProductId}`);
      await page.waitForLoadState('networkidle');

      // カートに追加ボタンをクリック
      await page.getByRole('button', { name: /カートに追加/i }).click();

      // 成功フィードバックが表示される
      await expect(page.locator('text=カートに追加しました')).toBeVisible({ timeout: 10000 });
    });

    test('在庫切れ商品のカート追加ボタンは無効化されている', async ({ page }) => {
      // キャンバストートバッグ（stock: 0）
      await page.goto('/catalog/550e8400-e29b-41d4-a716-446655440003');
      await page.waitForLoadState('networkidle');

      // ボタンが無効化されている
      const button = page.getByRole('button', { name: /カートに追加/i });
      await expect(button).toBeDisabled();
    });
  });

  test.describe('US2: カート内容を確認する', () => {
    test('カートに商品を追加後、カートページで内容を確認できる', async ({ page }) => {
      // 商品をカートに追加
      await addProductToCart(page, testProductId);

      // カートページへ遷移
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');

      // 商品名が表示される
      await expect(page.locator('text=E2Eテスト商品')).toBeVisible();

      // 金額明細が表示される
      await expect(page.getByTestId('cart-subtotal')).toBeVisible();
      await expect(page.getByTestId('cart-tax')).toBeVisible();
      await expect(page.getByTestId('cart-total')).toBeVisible();
    });

    test('カートが空の場合は空状態メッセージを表示する', async ({ page }) => {
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');

      // 空状態メッセージ
      await expect(page.locator('text=カートに商品がありません')).toBeVisible();

      // 商品一覧へのリンク
      await expect(page.getByRole('link', { name: '商品一覧を見る' })).toBeVisible();
    });

    test('ヘッダーのカートリンクからカートページに遷移できる', async ({ page }) => {
      await page.goto('/catalog');
      await page.waitForLoadState('networkidle');

      // カートリンクをクリック（ナビゲーションリンク）
      await page.getByRole('link', { name: 'カート' }).first().click();

      // カートページに遷移
      await expect(page).toHaveURL('/cart');
    });
  });

  test.describe('US3: カート内の数量を変更する', () => {
    test('カートページで数量を変更し、合計が更新される', async ({ page }) => {
      // 商品をカートに追加
      await addProductToCart(page, testProductId);

      // カートページへ
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');

      // +ボタンで数量を増やす（1 → 2）
      const plusButton = page.getByRole('button', { name: /数量を増やす/ }).first();
      await plusButton.click();

      // 合計金額が更新される（3000 * 2 = 6000）
      await expect(page.getByTestId('cart-subtotal')).toContainText('¥6,000', { timeout: 10000 });
    });
  });

  test.describe('US4: カートから商品を削除する', () => {
    test('確認ダイアログで「削除する」を選択すると商品が削除される', async ({ page }) => {
      // 商品をカートに追加
      await addProductToCart(page, testProductId);

      // カートページへ
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=E2Eテスト商品')).toBeVisible();

      // 削除ボタンをクリック
      await page.getByRole('button', { name: /E2Eテスト商品を削除/ }).click();

      // 確認ダイアログが表示される
      await expect(page.getByTestId('confirm-dialog')).toBeVisible();

      // 「削除する」をクリック
      await page.getByTestId('confirm-button').click();

      // 空カート状態になる
      await expect(page.locator('text=カートに商品がありません')).toBeVisible({ timeout: 10000 });
    });

    test('確認ダイアログで「キャンセル」を選択すると商品が残る', async ({ page }) => {
      // 商品をカートに追加
      await addProductToCart(page, testProductId);

      // カートページへ
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');

      // 削除ボタンをクリック
      await page.getByRole('button', { name: /E2Eテスト商品を削除/ }).click();

      // 確認ダイアログが表示される
      await expect(page.getByTestId('confirm-dialog')).toBeVisible();

      // 「キャンセル」をクリック
      await page.getByTestId('cancel-button').click();

      // ダイアログが閉じる
      await expect(page.getByTestId('confirm-dialog')).not.toBeVisible();

      // 商品はまだ表示されている
      await expect(page.locator('text=E2Eテスト商品')).toBeVisible();
    });
  });

  test.describe('US5: カート内容の永続化', () => {
    test('ページ遷移後もカート内容が保持される', async ({ page }) => {
      // 商品をカートに追加
      await addProductToCart(page, testProductId);

      // 商品一覧へ遷移
      await page.goto('/catalog');
      await page.waitForLoadState('networkidle');

      // カートページに戻る
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');

      // カート内容が保持されている
      await expect(page.locator('text=E2Eテスト商品')).toBeVisible();
      await expect(page.getByTestId('cart-subtotal')).toContainText('¥3,000');
    });

    test('ブラウザリロード後もカート内容が保持される', async ({ page }) => {
      // 商品をカートに追加
      await addProductToCart(page, testProductId);

      // カートページへ
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=E2Eテスト商品')).toBeVisible();

      // リロード
      await page.reload();
      await page.waitForLoadState('networkidle');

      // カート内容が保持されている
      await expect(page.locator('text=E2Eテスト商品')).toBeVisible();
      await expect(page.getByTestId('cart-subtotal')).toContainText('¥3,000');
    });
  });
});
