/**
 * Catalog ドメイン - API統合テスト（本番）
 * 契約スキーマとの整合性検証
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import {
  GetProductsInputSchema,
  GetProductsOutputSchema,
  GetProductByIdOutputSchema,
  type Product,
  type ProductRepository,
} from '@/contracts/catalog';
import {
  getProducts,
  getProductById,
} from '@/domains/catalog/api';

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

function createMockSession(role: 'buyer' | 'admin' = 'buyer'): Session {
  return {
    userId: 'user-123',
    role,
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'テスト商品',
    price: 1000,
    stock: 10,
    description: '商品の説明',
    imageUrl: 'https://example.com/image.jpg',
    status: 'published',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  };
}

function createMockRepository(): ProductRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  };
}

// ─────────────────────────────────────────────────────────────────
// 契約検証テスト
// ─────────────────────────────────────────────────────────────────

describe('Catalog API統合テスト（本番）', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('getProducts', () => {
    it('文字列の入力パラメータ（クエリパラメータ形式）が正しく変換される', async () => {
      const rawInput = { page: '2', limit: '10' };
      const validatedInput = GetProductsInputSchema.parse(rawInput);

      vi.mocked(repository.findAll).mockResolvedValue([createMockProduct()]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getProducts(validatedInput, {
        session: createMockSession(),
        repository,
      });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
    });

    it('出力が GetProductsOutputSchema に準拠する', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([createMockProduct()]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getProducts(
        { page: 1, limit: 12 },
        { session: createMockSession(), repository }
      );

      const validated = GetProductsOutputSchema.parse(result);
      expect(validated.products).toHaveLength(1);
      expect(validated.products[0].stock).toBe(10);
      expect(validated.pagination.total).toBe(1);
    });

    it('ページネーション計算が正確である', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([createMockProduct()]);
      vi.mocked(repository.count).mockResolvedValue(25);

      const result = await getProducts(
        { page: 1, limit: 12 },
        { session: createMockSession(), repository }
      );

      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3); // ceil(25/12) = 3
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(12);
    });
  });

  describe('getProductById', () => {
    it('出力が GetProductByIdOutputSchema に準拠する（stock フィールド含む）', async () => {
      const product = createMockProduct({ stock: 15 });
      vi.mocked(repository.findById).mockResolvedValue(product);

      const result = await getProductById(
        { id: product.id },
        { session: createMockSession(), repository }
      );

      const validated = GetProductByIdOutputSchema.parse(result);
      expect(validated.id).toBe(product.id);
      expect(validated.stock).toBe(15);
    });

    it('一覧取得 → 詳細取得のエンドツーエンドフローが正常に動作する', async () => {
      const products = [
        createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', name: '商品A', stock: 10 }),
        createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440002', name: '商品B', stock: 0 }),
      ];

      vi.mocked(repository.findAll).mockResolvedValue(products);
      vi.mocked(repository.count).mockResolvedValue(2);
      vi.mocked(repository.findById).mockResolvedValue(products[0]);

      // 1. 一覧取得
      const listResult = await getProducts(
        { page: 1, limit: 12 },
        { session: createMockSession(), repository }
      );

      expect(listResult.products).toHaveLength(2);

      // 2. 詳細取得
      const detailResult = await getProductById(
        { id: listResult.products[0].id },
        { session: createMockSession(), repository }
      );

      expect(detailResult.name).toBe('商品A');
      expect(detailResult.stock).toBe(10);
    });
  });

  describe('getProducts（キーワード検索）', () => {
    it('keyword 付きの入力が GetProductsInputSchema に準拠する', () => {
      const rawInput = { page: '1', limit: '12', keyword: 'Tシャツ' };
      const validated = GetProductsInputSchema.parse(rawInput);
      expect(validated.keyword).toBe('Tシャツ');
      expect(validated.page).toBe(1);
    });

    it('keyword 付きの出力が GetProductsOutputSchema に準拠する', async () => {
      const products = [createMockProduct({ name: 'ミニマルTシャツ' })];
      vi.mocked(repository.findAll).mockResolvedValue(products);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getProducts(
        { page: 1, limit: 12, keyword: 'Tシャツ' },
        { session: createMockSession(), repository }
      );

      const validated = GetProductsOutputSchema.parse(result);
      expect(validated.products).toHaveLength(1);
      expect(validated.products[0].name).toBe('ミニマルTシャツ');
    });

    it('検索 → 詳細取得のフローが正常に動作する', async () => {
      const searchResult = [createMockProduct({ name: 'ミニマルTシャツ' })];
      vi.mocked(repository.findAll).mockResolvedValue(searchResult);
      vi.mocked(repository.count).mockResolvedValue(1);
      vi.mocked(repository.findById).mockResolvedValue(searchResult[0]);

      // 1. 検索
      const listResult = await getProducts(
        { page: 1, limit: 12, keyword: 'Tシャツ' },
        { session: createMockSession(), repository }
      );
      expect(listResult.products).toHaveLength(1);

      // 2. 詳細取得
      const detailResult = await getProductById(
        { id: listResult.products[0].id },
        { session: createMockSession(), repository }
      );
      expect(detailResult.name).toBe('ミニマルTシャツ');
    });
  });
});
