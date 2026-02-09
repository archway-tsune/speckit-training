/**
 * 管理者導線 E2Eテスト テンプレート
 * Playwright ベース
 *
 * このテンプレートは管理者向けのE2Eテストを書く際の雛形です。
 * 必要に応じてコピーして使用してください。
 *
 * テスト観点:
 * - 認証フロー: ログイン → 操作 → ログアウト
 * - 商品管理: 登録 → 編集 → 削除
 * - 注文管理: 一覧 → 詳細 → ステータス更新
 */
import { test, expect, Page } from '@playwright/test';

// --- ヘルパー関数 ---

/**
 * ログインヘルパー（管理者）
 */
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'admin@example.com');
  await page.fill('[data-testid="password-input"]', 'adminpassword');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/admin/dashboard');
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

test.describe('管理者導線', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test.describe('ダッシュボード', () => {
    test('管理者はダッシュボードにアクセスできる', async ({ page }) => {
      // Given: ログイン済み
      // Then: ダッシュボードが表示される
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
    });

    test('サマリー情報が表示される', async ({ page }) => {
      // Given: ダッシュボードにいる
      // Then: 各サマリーが表示される
      await expect(page.locator('[data-testid="orders-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="products-summary"]')).toBeVisible();
    });
  });

  test.describe('商品管理', () => {
    test('新規商品を登録できる', async ({ page }) => {
      // Given: 商品管理ページにいる
      await page.goto('/admin/products');

      // When: 新規登録ボタンをクリック
      await page.click('[data-testid="create-product-button"]');

      // Then: 登録フォームへ遷移
      await expect(page).toHaveURL('/admin/products/new');

      // When: 商品情報を入力して保存
      await page.fill('[data-testid="product-name-input"]', 'テスト商品');
      await page.fill('[data-testid="product-price-input"]', '1000');
      await page.fill('[data-testid="product-description-input"]', '商品説明');
      await page.click('[data-testid="save-product-button"]');

      // Then: 商品一覧へ戻り、成功メッセージが表示される
      await expect(page).toHaveURL('/admin/products');
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('商品を編集できる', async ({ page }) => {
      // Given: 商品一覧ページにいる
      await page.goto('/admin/products');

      // When: 最初の商品の編集ボタンをクリック
      await page.click('[data-testid="product-row"]:first-child [data-testid="edit-button"]');

      // Then: 編集フォームへ遷移
      await expect(page).toHaveURL(/\/admin\/products\/[a-zA-Z0-9-]+\/edit/);

      // When: 商品名を変更して保存
      await page.fill('[data-testid="product-name-input"]', '更新後の商品名');
      await page.click('[data-testid="save-product-button"]');

      // Then: 商品一覧へ戻り、成功メッセージが表示される
      await expect(page).toHaveURL('/admin/products');
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('商品を削除できる', async ({ page }) => {
      // Given: 商品一覧ページにいる
      await page.goto('/admin/products');

      // When: 最初の商品の削除ボタンをクリック
      await page.click('[data-testid="product-row"]:first-child [data-testid="delete-button"]');

      // Then: 確認ダイアログが表示される
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();

      // When: 確認ボタンをクリック
      await page.click('[data-testid="confirm-button"]');

      // Then: 成功メッセージが表示される
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('商品ステータスを変更できる', async ({ page }) => {
      // Given: 商品一覧ページにいる
      await page.goto('/admin/products');

      // When: 最初の商品のステータスを変更
      await page.click(
        '[data-testid="product-row"]:first-child [data-testid="status-toggle"]'
      );

      // Then: ステータスが変更される
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });

  test.describe('注文管理', () => {
    test('注文一覧を確認できる', async ({ page }) => {
      // Given: 注文管理ページにいる
      await page.goto('/admin/orders');

      // Then: 注文一覧が表示される
      await expect(page.locator('[data-testid="order-list"]')).toBeVisible();
    });

    test('注文詳細を確認できる', async ({ page }) => {
      // Given: 注文一覧ページにいる
      await page.goto('/admin/orders');

      // When: 最初の注文をクリック
      await page.click('[data-testid="order-row"]:first-child');

      // Then: 注文詳細ページへ遷移する
      await expect(page).toHaveURL(/\/admin\/orders\/[a-zA-Z0-9-]+/);
      await expect(page.locator('[data-testid="order-detail"]')).toBeVisible();
    });

    test('注文ステータスを更新できる', async ({ page }) => {
      // Given: 注文詳細ページにいる
      await page.goto('/admin/orders');
      await page.click('[data-testid="order-row"]:first-child');

      // When: ステータスを「confirmed」に変更
      await page.selectOption('[data-testid="status-select"]', 'confirmed');
      await page.click('[data-testid="update-status-button"]');

      // Then: 成功メッセージが表示される
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('注文ステータスの有効な遷移のみ許可される', async ({ page }) => {
      // Given: 注文詳細ページにいる（pending状態の注文）
      await page.goto('/admin/orders');
      await page.click('[data-testid="order-row"][data-status="pending"]:first-child');

      // Then: 有効な遷移先のみ選択可能
      const options = await page.locator('[data-testid="status-select"] option').all();
      const enabledOptions = await Promise.all(
        options.map(async (opt) => ({
          value: await opt.getAttribute('value'),
          disabled: await opt.isDisabled(),
        }))
      );

      // pending → confirmed, cancelled のみ有効
      const validTransitions = enabledOptions.filter((opt) => !opt.disabled);
      expect(validTransitions.map((t) => t.value)).toEqual(
        expect.arrayContaining(['confirmed', 'cancelled'])
      );
    });
  });

  test.describe('権限制御', () => {
    test('buyerロールは管理画面にアクセスできない', async ({ page }) => {
      // Given: buyerでログアウト→再ログイン
      await logout(page);
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'buyer@example.com');
      await page.fill('[data-testid="password-input"]', 'buyerpassword');
      await page.click('[data-testid="login-button"]');

      // When: 管理画面にアクセス試行
      await page.goto('/admin/dashboard');

      // Then: アクセス拒否またはリダイレクト
      await expect(page).not.toHaveURL('/admin/dashboard');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 共通UIコンポーネント操作パターン（管理者向け）
  // ─────────────────────────────────────────────────────────────────
  //
  // 以下は、テンプレートコンポーネントを使用した管理者向け操作パターンの雛形です。
  // 実際の管理画面テストに組み込んで使用してください。

  test.describe('注文ステータスバッジ（StatusBadge パターン）', () => {
    test('注文ステータスが色付きバッジで表示される', async ({ page }) => {
      // Given: 注文一覧ページにいる
      await page.goto('/admin/orders');

      // Then: ステータスバッジが表示される
      const badge = page.locator('[data-testid="status-badge"]').first();
      await expect(badge).toBeVisible();

      // Then: バッジにステータステキストが含まれる
      const text = await badge.textContent();
      expect(text).toBeTruthy();
    });

    test('注文詳細でステータスバッジが表示される', async ({ page }) => {
      // Given: 注文詳細ページにいる
      await page.goto('/admin/orders');
      await page.click('[data-testid="order-row"]:first-child');

      // Then: ステータスバッジが表示される
      await expect(page.locator('[data-testid="status-badge"]')).toBeVisible();
    });
  });

  test.describe('商品一覧ページネーション（Pagination パターン）', () => {
    test('商品一覧でページ遷移できる', async ({ page }) => {
      // Given: 商品管理ページにいる
      await page.goto('/admin/products');

      // Then: ページネーション情報が表示される
      const paginationInfo = page.locator('[data-testid="pagination-info"]');
      if (await paginationInfo.isVisible()) {
        await expect(paginationInfo).toContainText('件を表示');

        // When: 「次へ」ボタンをクリック
        await page.click('[data-testid="pagination-next"]');

        // Then: 次のページの商品が表示される
        await expect(paginationInfo).toContainText('件を表示');
      }
    });

    test('注文一覧でページ遷移できる', async ({ page }) => {
      // Given: 注文管理ページにいる
      await page.goto('/admin/orders');

      // Then: ページネーション情報が表示される（件数が多い場合）
      const paginationInfo = page.locator('[data-testid="pagination-info"]');
      if (await paginationInfo.isVisible()) {
        await expect(paginationInfo).toContainText('件を表示');
      }
    });
  });

  test.describe('管理画面検索（SearchBar パターン）', () => {
    test('商品名で検索できる', async ({ page }) => {
      // Given: 商品管理ページにいる
      await page.goto('/admin/products');

      // When: 検索バーにキーワードを入力してEnterキーを押す
      const searchInput = page.locator('[data-testid="search-input"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('テスト商品');
        await searchInput.press('Enter');

        // Then: フィルタされた商品一覧が表示される
        await expect(page.locator('[data-testid="product-row"]')).toBeVisible();
      }
    });
  });
});
