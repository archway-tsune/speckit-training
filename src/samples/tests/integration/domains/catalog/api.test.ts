/**
 * Catalog ドメイン - API統合テスト
 * 契約スキーマとの整合性検証
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import {
  GetProductsInputSchema,
  GetProductsOutputSchema,
  GetProductByIdOutputSchema,
  CreateProductInputSchema,
  CreateProductOutputSchema,
  type Product,
} from '@/contracts/catalog';
import {
  getProducts,
  getProductById,
  createProduct,
  type ProductRepository,
} from '@/samples/domains/catalog/api/usecases';

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

describe('Catalog API統合テスト', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('getProducts', () => {
    it('入力スキーマに準拠したリクエストを処理できる', async () => {
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

    it('出力スキーマに準拠したレスポンスを返す', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([createMockProduct()]);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getProducts(
        { page: 1, limit: 20 },
        { session: createMockSession(), repository }
      );

      // 出力スキーマで検証
      const validated = GetProductsOutputSchema.parse(result);
      expect(validated.products).toHaveLength(1);
      expect(validated.pagination.total).toBe(1);
    });

    it('クエリパラメータからの変換を正しく処理する', async () => {
      // URLSearchParams をシミュレート（全て文字列）
      const queryParams = {
        page: '3',
        limit: '50',
        status: 'published',
      };

      const validatedInput = GetProductsInputSchema.parse(queryParams);

      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      const result = await getProducts(validatedInput, {
        session: createMockSession('admin'),
        repository,
      });

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.limit).toBe(50);
    });
  });

  describe('getProductById', () => {
    it('出力スキーマに準拠した商品を返す', async () => {
      const product = createMockProduct();
      vi.mocked(repository.findById).mockResolvedValue(product);

      const result = await getProductById(
        { id: product.id },
        { session: createMockSession(), repository }
      );

      // 出力スキーマで検証
      const validated = GetProductByIdOutputSchema.parse(result);
      expect(validated.id).toBe(product.id);
      expect(validated.name).toBe('テスト商品');
    });
  });

  describe('createProduct', () => {
    it('入力スキーマのバリデーションメッセージを返す', async () => {
      const invalidInput = {
        name: '', // 必須
        price: 1000,
      };

      const parseResult = CreateProductInputSchema.safeParse(invalidInput);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        const error = parseResult.error.errors[0];
        expect(error.message).toBe('商品名を入力してください');
      }
    });

    it('出力スキーマに準拠した商品を返す', async () => {
      const newProduct = createMockProduct();
      vi.mocked(repository.create).mockResolvedValue(newProduct);

      const result = await createProduct(
        { name: 'テスト商品', price: 1000, stock: 10 },
        { session: createMockSession('admin'), repository }
      );

      // 出力スキーマで検証
      const validated = CreateProductOutputSchema.parse(result);
      expect(validated.name).toBe('テスト商品');
    });
  });

  describe('エンドツーエンドフロー', () => {
    it('商品一覧取得 → 詳細取得 の流れが正常に動作する', async () => {
      const products = [
        createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', name: '商品A' }),
        createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440002', name: '商品B' }),
      ];

      vi.mocked(repository.findAll).mockResolvedValue(products);
      vi.mocked(repository.count).mockResolvedValue(2);
      vi.mocked(repository.findById).mockResolvedValue(products[0]);

      // 1. 一覧取得
      const listResult = await getProducts(
        { page: 1, limit: 20 },
        { session: createMockSession(), repository }
      );

      expect(listResult.products).toHaveLength(2);

      // 2. 詳細取得
      const detailResult = await getProductById(
        { id: listResult.products[0].id },
        { session: createMockSession(), repository }
      );

      expect(detailResult.name).toBe('商品A');
    });

    it('商品登録 → 一覧確認 の流れが正常に動作する', async () => {
      const newProduct = createMockProduct();
      vi.mocked(repository.create).mockResolvedValue(newProduct);
      vi.mocked(repository.findAll).mockResolvedValue([newProduct]);
      vi.mocked(repository.count).mockResolvedValue(1);

      // 1. 商品登録
      const created = await createProduct(
        { name: 'テスト商品', price: 1000, stock: 10 },
        { session: createMockSession('admin'), repository }
      );

      expect(created.name).toBe('テスト商品');

      // 2. 一覧で確認
      const listResult = await getProducts(
        { page: 1, limit: 20 },
        { session: createMockSession('admin'), repository }
      );

      expect(listResult.products).toHaveLength(1);
      expect(listResult.products[0].id).toBe(created.id);
    });
  });

  describe('認可フロー', () => {
    it('buyerはpublished商品のみ取得できる', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await getProducts(
        { page: 1, limit: 20, status: 'draft' }, // draftを指定しても
        { session: createMockSession('buyer'), repository }
      );

      // buyerの場合はpublishedに強制される
      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'published' })
      );
    });

    it('adminは全ステータスの商品を取得できる', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      await getProducts(
        { page: 1, limit: 20, status: 'draft' },
        { session: createMockSession('admin'), repository }
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'draft' })
      );
    });
  });
});
