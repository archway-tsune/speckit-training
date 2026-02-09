/**
 * Product ドメイン - API 統合テスト
 * 実リポジトリとの連携テスト
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import { productRepository, resetProductStore } from '@/infrastructure/repositories/product';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  NotFoundError,
} from '@/domains/product/api';

function createAdminSession(): Session {
  return {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    role: 'admin',
    expiresAt: new Date(Date.now() + 3600000),
  };
}

describe('Product ドメイン統合テスト', () => {
  beforeEach(() => {
    resetProductStore();
  });

  describe('CRUD フロー', () => {
    it('商品を作成 → 取得 → 更新 → ステータス変更 → 削除できる', async () => {
      const session = createAdminSession();
      const context = { session, repository: productRepository };

      // 1. 商品登録
      const created = await createProduct(
        { name: '統合テスト商品', price: 2000, stock: 5 },
        context
      );
      expect(created.name).toBe('統合テスト商品');
      expect(created.price).toBe(2000);
      expect(created.status).toBe('draft');

      // 2. 詳細取得
      const fetched = await getProductById({ id: created.id }, context);
      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe('統合テスト商品');

      // 3. 部分更新
      const updated = await updateProduct(
        { id: created.id, name: '更新後の商品名', price: 3000 },
        context
      );
      expect(updated.name).toBe('更新後の商品名');
      expect(updated.price).toBe(3000);
      expect(updated.stock).toBe(5); // 変更なし

      // 4. ステータス変更
      const published = await updateProductStatus(
        { id: created.id, status: 'published' },
        context
      );
      expect(published.status).toBe('published');

      // 5. 削除
      const deleteResult = await deleteProduct({ id: created.id }, context);
      expect(deleteResult).toEqual({ success: true });

      // 削除後は取得不可
      await expect(
        getProductById({ id: created.id }, context)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('商品一覧取得', () => {
    it('ページネーションが正しく動作する', async () => {
      const session = createAdminSession();
      const context = { session, repository: productRepository };

      // サンプルデータ14件 + limit=5 で3ページ
      const page1 = await getProducts({ page: '1', limit: '5' }, context);
      expect(page1.products).toHaveLength(5);
      expect(page1.pagination.page).toBe(1);
      expect(page1.pagination.total).toBe(14);
      expect(page1.pagination.totalPages).toBe(3);

      const page3 = await getProducts({ page: '3', limit: '5' }, context);
      expect(page3.products).toHaveLength(4);
    });

    it('ステータスフィルタが動作する', async () => {
      const session = createAdminSession();
      const context = { session, repository: productRepository };

      // draft商品を追加
      await createProduct({ name: 'Draft商品', price: 100 }, context);

      const drafts = await getProducts({ status: 'draft' }, context);
      expect(drafts.products.every(p => p.status === 'draft')).toBe(true);
      expect(drafts.products.length).toBeGreaterThan(0);
    });
  });

  describe('バリデーション', () => {
    it('商品名が空の場合にエラーがスローされる', async () => {
      const session = createAdminSession();
      const context = { session, repository: productRepository };

      await expect(
        createProduct({ name: '', price: 1000 }, context)
      ).rejects.toThrow();
    });

    it('価格が負の値の場合にエラーがスローされる', async () => {
      const session = createAdminSession();
      const context = { session, repository: productRepository };

      await expect(
        createProduct({ name: 'テスト', price: -1 }, context)
      ).rejects.toThrow();
    });
  });

  describe('認可', () => {
    it('buyer は全操作でForbiddenErrorがスローされる', async () => {
      const buyerSession: Session = {
        userId: '550e8400-e29b-41d4-a716-446655440099',
        role: 'buyer',
        expiresAt: new Date(Date.now() + 3600000),
      };
      const context = { session: buyerSession, repository: productRepository };

      await expect(getProducts({}, context)).rejects.toThrow('権限がありません');
      await expect(getProductById({ id: '550e8400-e29b-41d4-a716-446655440000' }, context)).rejects.toThrow('権限がありません');
      await expect(createProduct({ name: 'テスト', price: 100 }, context)).rejects.toThrow('権限がありません');
    });
  });
});
