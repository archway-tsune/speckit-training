/**
 * 商品管理機能 - 管理者導線E2Eテスト
 * 商品一覧表示、新規登録、編集、ステータス変更、削除の一連のフローを検証
 */
import { test, expect } from '@playwright/test';

// 管理者ログイン
async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.locator('#email').fill('admin@example.com');
  await page.locator('#password').fill('demo');
  await page.getByRole('button', { name: /ログイン/i }).click();
  await page.waitForURL(/\/admin/);
  await page.waitForLoadState('networkidle');
}

test.describe('管理者導線 - 商品管理', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test.describe('商品一覧', () => {
    test('管理者が商品一覧をテーブル形式で確認できる', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');

      // テーブルヘッダーが表示される
      await expect(page.locator('th:text("商品名")')).toBeVisible();
      await expect(page.locator('th:text("価格")')).toBeVisible();
      await expect(page.locator('th:text("ステータス")')).toBeVisible();

      // 商品が表示される（サンプルデータは14件）
      await expect(page.locator('text=E2Eテスト商品')).toBeVisible();
      await expect(page.locator('text=ミニマルTシャツ')).toBeVisible();
    });

    test('サイドバーの商品管理リンクから遷移できる', async ({ page }) => {
      await loginAsAdmin(page);

      // サイドバーの商品管理リンクをクリック
      await page.getByRole('link', { name: '商品管理' }).click();
      await page.waitForURL('/admin/products');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1:text("商品管理")')).toBeVisible();
    });
  });

  test.describe('商品新規登録', () => {
    test('新規登録→一覧に「下書き」ステータスで表示される', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');

      // 新規登録リンクをクリック
      await page.getByRole('link', { name: '新規登録' }).click();
      await page.waitForURL('/admin/products/new');
      await page.waitForLoadState('networkidle');

      // フォームに入力
      await page.locator('#name').fill('E2E新商品テスト');
      await page.locator('#price').fill('5000');
      await page.locator('#stock').fill('10');
      await page.locator('#description').fill('E2Eテストで作成した商品です');

      // 登録ボタンをクリック
      await page.getByRole('button', { name: '登録' }).click();

      // 一覧に遷移
      await page.waitForURL('/admin/products');
      await page.waitForLoadState('networkidle');

      // 新商品が一覧に表示される
      await expect(page.locator('text=E2E新商品テスト')).toBeVisible();
    });
  });

  test.describe('商品編集', () => {
    test('編集ページで既存データがプリロードされ、保存後に一覧に反映される', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');

      // 最初の商品の編集リンクをクリック
      await page.getByRole('link', { name: '編集' }).first().click();
      await page.waitForURL(/\/admin\/products\/[a-f0-9-]+\/edit/);
      await page.waitForLoadState('networkidle');

      // 既存データがプリロードされている
      await expect(page.locator('h1:text("商品編集")')).toBeVisible();
      const nameInput = page.locator('#name');
      await expect(nameInput).not.toHaveValue('');

      // 商品名を変更
      await nameInput.clear();
      await nameInput.fill('E2E編集テスト商品');

      // 保存ボタンをクリック
      await page.getByRole('button', { name: '保存' }).click();

      // 一覧に遷移
      await page.waitForURL('/admin/products');
      await page.waitForLoadState('networkidle');

      // 変更後の商品名が表示される
      await expect(page.locator('text=E2E編集テスト商品')).toBeVisible();
    });
  });

  test.describe('ステータス変更', () => {
    test('ドロップダウンからステータスを即時変更できる', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');

      // 「E2Eテスト商品」の行を特定（published状態のはず）
      const targetRow = page.locator('tbody tr', { hasText: 'E2Eテスト商品' });
      await expect(targetRow).toBeVisible();

      const selectInRow = targetRow.locator('select');
      await expect(selectInRow).toHaveValue('published');

      // ステータスを archived に変更
      await selectInRow.selectOption('archived');

      // ページをリロードして反映を確認
      await page.waitForLoadState('networkidle');
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 変更が反映されている
      const updatedRow = page.locator('tbody tr', { hasText: 'E2Eテスト商品' });
      await expect(updatedRow.locator('select')).toHaveValue('archived');
    });
  });

  test.describe('商品削除', () => {
    test('削除確認ダイアログで「削除する」を選択すると商品が消える', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');

      // 削除対象の商品名を取得
      const targetRow = page.locator('tbody tr').first();
      const productName = await targetRow.locator('td').first().textContent();

      // 削除ボタンをクリック
      await targetRow.getByRole('button', { name: '削除' }).click();

      // 確認ダイアログが表示される
      await expect(page.locator('text=を削除しますか')).toBeVisible();

      // 「削除する」をクリック
      await page.getByRole('button', { name: '削除する' }).click();

      // ダイアログが閉じてページがリロードされる
      await page.waitForLoadState('networkidle');

      // 削除された商品が一覧から消える
      if (productName) {
        await expect(page.locator(`td:text-is("${productName}")`)).not.toBeVisible();
      }
    });

    test('削除確認ダイアログで「キャンセル」を選択すると商品は残る', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/products');
      await page.waitForLoadState('networkidle');

      // 削除対象の商品名を取得
      const targetRow = page.locator('tbody tr').first();
      const productName = await targetRow.locator('td').first().textContent();

      // 削除ボタンをクリック
      await targetRow.getByRole('button', { name: '削除' }).click();

      // 確認ダイアログが表示される
      await expect(page.locator('text=を削除しますか')).toBeVisible();

      // 「キャンセル」をクリック
      await page.getByRole('button', { name: 'キャンセル' }).click();

      // 商品はまだ表示されている
      if (productName) {
        await expect(page.locator(`text=${productName}`).first()).toBeVisible();
      }
    });
  });
});
