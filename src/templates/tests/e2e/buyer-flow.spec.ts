/**
 * 購入者導線 E2Eテスト テンプレート
 * Playwright ベース
 *
 * このテンプレートは購入者向けのE2Eテストを書く際の雛形です。
 * 必要に応じてコピーして使用してください。
 *
 * テスト観点:
 * - 認証フロー: ログイン → 操作 → ログアウト
 * - 商品閲覧: 一覧 → 詳細 → カート追加
 * - 購入フロー: カート確認 → 注文確定
 */
import { test, expect, Page } from '@playwright/test';

// --- ヘルパー関数 ---

/**
 * ログインヘルパー
 */
async function login(page: Page, role: 'buyer' | 'admin' = 'buyer'): Promise<void> {
  // テスト環境のログインページへ遷移
  await page.goto('/login');

  // ログイン情報を入力
  await page.fill('[data-testid="email-input"]', `test-${role}@example.com`);
  await page.fill('[data-testid="password-input"]', 'testpassword');

  // ログインボタンをクリック
  await page.click('[data-testid="login-button"]');

  // ログイン完了を待機
  await page.waitForURL('/');
}

/**
 * ログアウトヘルパー
 */
async function logout(page: Page): Promise<void> {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login');
}

// --- テスト本体 ---

test.describe('購入者導線', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にログイン
    await login(page, 'buyer');
  });

  test.afterEach(async ({ page }) => {
    // 各テスト後にログアウト
    await logout(page);
  });

  test.describe('商品閲覧', () => {
    test('商品一覧から詳細ページへ遷移できる', async ({ page }) => {
      // Given: 商品一覧ページにいる
      await page.goto('/catalog');

      // Then: 商品一覧が表示される
      await expect(page.locator('[data-testid="product-list"]')).toBeVisible();

      // When: 最初の商品をクリック
      await page.click('[data-testid="product-card"]:first-child');

      // Then: 商品詳細ページへ遷移する
      await expect(page).toHaveURL(/\/catalog\/[a-zA-Z0-9-]+/);
      await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();
    });

    test('商品詳細から一覧へ戻れる', async ({ page }) => {
      // Given: 商品詳細ページにいる
      await page.goto('/catalog');
      await page.click('[data-testid="product-card"]:first-child');
      await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();

      // When: 戻るボタンをクリック
      await page.click('[data-testid="back-button"]');

      // Then: 商品一覧ページへ戻る
      await expect(page).toHaveURL('/catalog');
    });
  });

  test.describe('カート操作', () => {
    test('商品をカートに追加できる', async ({ page }) => {
      // Given: 商品詳細ページにいる
      await page.goto('/catalog');
      await page.click('[data-testid="product-card"]:first-child');

      // When: カートに追加ボタンをクリック
      await page.click('[data-testid="add-to-cart-button"]');

      // Then: カート件数が更新される
      await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
    });

    test('カート内の商品数量を変更できる', async ({ page }) => {
      // Given: カートに商品がある
      await page.goto('/catalog');
      await page.click('[data-testid="product-card"]:first-child');
      await page.click('[data-testid="add-to-cart-button"]');

      // When: カートページで数量を変更
      await page.goto('/cart');
      await page.fill('[data-testid="quantity-input"]', '2');
      await page.click('[data-testid="update-quantity-button"]');

      // Then: 数量が更新される
      await expect(page.locator('[data-testid="cart-item-quantity"]')).toHaveValue('2');
    });

    test('カートから商品を削除できる', async ({ page }) => {
      // Given: カートに商品がある
      await page.goto('/catalog');
      await page.click('[data-testid="product-card"]:first-child');
      await page.click('[data-testid="add-to-cart-button"]');

      // When: カートページで削除
      await page.goto('/cart');
      await page.click('[data-testid="remove-item-button"]');

      // Then: カートが空になる
      await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible();
    });
  });

  test.describe('購入フロー', () => {
    test('商品閲覧からカート追加まで完了できる', async ({ page }) => {
      // Given: 商品一覧ページにいる
      await page.goto('/catalog');

      // When: 商品一覧→詳細→カート追加
      await page.click('[data-testid="product-card"]:first-child');
      await page.click('[data-testid="add-to-cart-button"]');

      // Then: カート件数が更新される
      await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
    });

    test('カートから注文確定まで完了できる', async ({ page }) => {
      // Given: カートに商品がある
      await page.goto('/catalog');
      await page.click('[data-testid="product-card"]:first-child');
      await page.click('[data-testid="add-to-cart-button"]');

      // When: カート→確認→注文確定
      await page.goto('/cart');
      await page.click('[data-testid="checkout-button"]');

      // Then: 確認画面へ遷移
      await expect(page).toHaveURL('/checkout/confirm');

      // When: 注文確定
      await page.click('[data-testid="confirm-order-button"]');

      // Then: 注文完了画面へ遷移
      await expect(page).toHaveURL(/\/orders\/[a-zA-Z0-9-]+/);
      await expect(page.locator('[data-testid="order-complete"]')).toBeVisible();
    });
  });

  test.describe('注文履歴', () => {
    test('注文履歴を確認できる', async ({ page }) => {
      // Given: 注文が存在する（フィクスチャで準備）
      // When: 注文履歴ページへ遷移
      await page.goto('/orders');

      // Then: 注文一覧が表示される
      await expect(page.locator('[data-testid="order-list"]')).toBeVisible();
    });

    test('注文詳細を確認できる', async ({ page }) => {
      // Given: 注文履歴ページにいる
      await page.goto('/orders');

      // When: 最初の注文をクリック
      await page.click('[data-testid="order-item"]:first-child');

      // Then: 注文詳細ページへ遷移する
      await expect(page).toHaveURL(/\/orders\/[a-zA-Z0-9-]+/);
      await expect(page.locator('[data-testid="order-detail"]')).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 共通UIコンポーネント操作パターン
  // ─────────────────────────────────────────────────────────────────
  //
  // 以下は、テンプレートコンポーネントを使用した操作パターンの雛形です。
  // 実際の導線テストに組み込んで使用してください。

  test.describe('商品検索（SearchBar パターン）', () => {
    test('キーワードで商品を検索できる', async ({ page }) => {
      // Given: 商品一覧ページにいる
      await page.goto('/catalog');

      // When: 検索バーにキーワードを入力してEnterキーを押す
      await page.fill('[data-testid="search-input"]', 'テスト商品');
      await page.press('[data-testid="search-input"]', 'Enter');

      // Then: 検索結果が表示される
      await expect(page.locator('[data-testid="product-list"]')).toBeVisible();
    });

    test('検索をクリアして全商品を表示できる', async ({ page }) => {
      // Given: 検索済みの状態
      await page.goto('/catalog');
      await page.fill('[data-testid="search-input"]', 'テスト');
      await page.press('[data-testid="search-input"]', 'Enter');

      // When: クリアボタンをクリック
      await page.click('[data-testid="search-clear"]');

      // Then: 全商品が表示される
      await expect(page.locator('[data-testid="search-input"]')).toHaveValue('');
    });
  });

  test.describe('ページネーション（Pagination パターン）', () => {
    test('次のページへ遷移できる', async ({ page }) => {
      // Given: 商品一覧ページの1ページ目にいる
      await page.goto('/catalog');

      // Then: ページネーション情報が表示される
      await expect(page.locator('[data-testid="pagination-info"]')).toBeVisible();

      // When: 「次へ」ボタンをクリック
      await page.click('[data-testid="pagination-next"]');

      // Then: 2ページ目の商品が表示される
      await expect(page.locator('[data-testid="pagination-info"]')).toContainText('件を表示');
    });

    test('前のページへ戻れる', async ({ page }) => {
      // Given: 2ページ目にいる
      await page.goto('/catalog');
      await page.click('[data-testid="pagination-next"]');

      // When: 「前へ」ボタンをクリック
      await page.click('[data-testid="pagination-prev"]');

      // Then: 1ページ目に戻る
      await expect(page.locator('[data-testid="pagination-prev"]')).toBeDisabled();
    });
  });

  test.describe('数量変更（QuantitySelector パターン）', () => {
    test('カート内の商品数量を+ボタンで増やせる', async ({ page }) => {
      // Given: カートに商品がある
      await page.goto('/cart');

      // When: +ボタンをクリック
      await page.click('[data-testid="quantity-increment"]');

      // Then: 数量が増加する
      await expect(page.locator('[data-testid="quantity-value"]')).toBeVisible();
    });

    test('カート内の商品数量を-ボタンで減らせる', async ({ page }) => {
      // Given: カートに数量2以上の商品がある
      await page.goto('/cart');

      // When: -ボタンをクリック
      await page.click('[data-testid="quantity-decrement"]');

      // Then: 数量が減少する
      await expect(page.locator('[data-testid="quantity-value"]')).toBeVisible();
    });
  });

  test.describe('画像プレースホルダー（ImagePlaceholder パターン）', () => {
    test('画像がない商品にはプレースホルダーが表示される', async ({ page }) => {
      // Given: 画像が設定されていない商品がある
      await page.goto('/catalog');

      // Then: プレースホルダーが表示される
      const placeholder = page.locator('[data-testid="image-placeholder"]');
      if (await placeholder.count() > 0) {
        await expect(placeholder.first()).toBeVisible();
      }
    });
  });
});
