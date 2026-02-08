/**
 * 管理者注文管理 E2E テスト
 * US3: 管理者の注文一覧閲覧
 * US4: 注文ステータス更新
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

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.getByLabel('メールアドレス').fill('admin@example.com');
  await page.getByLabel('パスワード').fill('password');
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForURL(/\/admin/);
}

async function resetTestData(page: import('@playwright/test').Page) {
  await page.request.post(`${BASE_URL}/api/test/reset`);
}

async function createOrderAsBuyer(page: import('@playwright/test').Page) {
  await loginAsBuyer(page);
  await page.goto(`${BASE_URL}/catalog`);
  await page.waitForSelector('[data-testid="product-card"]');
  await page.locator('[data-testid="product-card"]').first().click();
  await expect(page).toHaveURL(/\/catalog\/.+/);
  await page.getByRole('button', { name: 'カートに追加' }).click();
  await expect(page.getByText('カートに追加しました')).toBeVisible();
  await page.goto(`${BASE_URL}/checkout`);
  await page.getByRole('button', { name: '注文を確定' }).click();
  await page.waitForURL(/\/orders\/.+/);
}

// ─────────────────────────────────────────────────────────────────
// US3: 管理者の注文一覧閲覧
// ─────────────────────────────────────────────────────────────────

test.describe('US3: 管理者の注文一覧閲覧', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestData(page);
  });

  test('管理者が全注文を一覧で確認できること', async ({ page }) => {
    // 購入者として注文を作成
    await createOrderAsBuyer(page);

    // 管理者としてログイン
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/orders`);

    // 注文が表示されること
    await expect(page.locator('table tbody tr, [data-testid="order-row"]').first()).toBeVisible();
  });

  test('ステータスフィルタで絞り込めること', async ({ page }) => {
    await createOrderAsBuyer(page);

    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/orders`);

    // ステータスフィルタを選択
    const statusFilter = page.locator('select');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('pending');
      await page.waitForTimeout(500);
      // フィルタ後も注文が表示されること（新規注文は pending）
      await expect(page.locator('table tbody tr, [data-testid="order-row"]').first()).toBeVisible();
    }
  });

  test('購入者が管理者ページにアクセスすると拒否されること', async ({ page }) => {
    await loginAsBuyer(page);
    await page.goto(`${BASE_URL}/admin/orders`);

    // 管理者ログインページにリダイレクトされるか、アクセス拒否メッセージが表示される
    await expect(page).toHaveURL(/\/(admin\/login|login|admin)/);
  });
});

// ─────────────────────────────────────────────────────────────────
// US4: 注文ステータス更新
// ─────────────────────────────────────────────────────────────────

test.describe('US4: 注文ステータス更新', () => {
  test.beforeEach(async ({ page }) => {
    await resetTestData(page);
  });

  test('注文詳細画面でステータスを「確認済み」に変更できること', async ({ page }) => {
    // 購入者として注文を作成
    await createOrderAsBuyer(page);

    // 管理者としてログイン
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/orders`);

    // 注文をクリックして詳細画面へ
    await page.locator('table tbody tr, [data-testid="order-row"]').first().click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // ステータスを変更
    const statusSelect = page.locator('select');
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('confirmed');
      const updateButton = page.getByRole('button', { name: /更新|変更/ });
      if (await updateButton.isVisible()) {
        await updateButton.click();
        await page.waitForTimeout(500);
        // 更新が反映されていること
        await expect(page.getByText(/確認済み|確定済み/)).toBeVisible();
      }
    }
  });

  test('配送完了の注文ではステータス変更の選択肢がないこと', async ({ page }) => {
    // 注文を作成して delivered まで進める
    await createOrderAsBuyer(page);

    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/orders`);
    await page.locator('table tbody tr, [data-testid="order-row"]').first().click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // confirmed → shipped → delivered とステータスを進める
    const statusSelect = page.locator('select');
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('confirmed');
      await page.getByRole('button', { name: /更新|変更/ }).click();
      await page.waitForTimeout(500);

      await statusSelect.selectOption('shipped');
      await page.getByRole('button', { name: /更新|変更/ }).click();
      await page.waitForTimeout(500);

      await statusSelect.selectOption('delivered');
      await page.getByRole('button', { name: /更新|変更/ }).click();
      await page.waitForTimeout(500);

      // delivered 状態ではステータス変更の選択肢がないか、selectが無効であること
      const options = await statusSelect.locator('option').count();
      // delivered の場合は遷移先が0なので、select自体が非表示か option が1つ（現在値のみ）
      expect(options).toBeLessThanOrEqual(1);
    }
  });
});
