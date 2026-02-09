/**
 * Catalog ドメイン - ユースケース単体テスト（本番）
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import {
  getProducts,
  getProductById,
  NotFoundError,
  type CatalogContext,
} from '@/domains/catalog/api';
import type { Product, ProductRepository } from '@/contracts/catalog';

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
// 商品一覧取得 (getProducts)
// ─────────────────────────────────────────────────────────────────

describe('getProducts', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('Given: 購入者ユーザー', () => {
    describe('When: 商品一覧を取得する', () => {
      it('Then: published 商品一覧をページネーション付きで取得できる', async () => {
        const products = [
          createMockProduct(),
          createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', name: '商品2' }),
        ];
        vi.mocked(repository.findAll).mockResolvedValue(products);
        vi.mocked(repository.count).mockResolvedValue(2);

        const result = await getProducts(
          { page: 1, limit: 12 },
          { session: createMockSession('buyer'), repository }
        );

        expect(result.products).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(12);
        expect(result.pagination.totalPages).toBe(1);
      });

      it('Then: 購入者は published 商品のみ取得される', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        await getProducts(
          { page: 1, limit: 12 },
          { session: createMockSession('buyer'), repository }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'published' })
        );
      });
    });

    describe('When: 在庫0の商品が含まれる', () => {
      it('Then: 在庫0の商品も一覧に含まれる（除外されない）', async () => {
        const products = [
          createMockProduct({ stock: 10 }),
          createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', stock: 0 }),
        ];
        vi.mocked(repository.findAll).mockResolvedValue(products);
        vi.mocked(repository.count).mockResolvedValue(2);

        const result = await getProducts(
          { page: 1, limit: 12 },
          { session: createMockSession('buyer'), repository }
        );

        expect(result.products).toHaveLength(2);
        expect(result.products[1].stock).toBe(0);
      });
    });

    describe('When: 商品が0件の場合', () => {
      it('Then: 空配列とページネーション情報（total: 0, totalPages: 0）を返す', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        const result = await getProducts(
          { page: 1, limit: 12 },
          { session: createMockSession('buyer'), repository }
        );

        expect(result.products).toEqual([]);
        expect(result.pagination.total).toBe(0);
        expect(result.pagination.totalPages).toBe(0);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 商品詳細取得 (getProductById)
// ─────────────────────────────────────────────────────────────────

describe('getProductById', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('Given: 購入者ユーザー', () => {
    describe('When: 存在する published 商品の詳細を取得する', () => {
      it('Then: 商品詳細情報（stock 含む）を返す', async () => {
        const product = createMockProduct({ stock: 15 });
        vi.mocked(repository.findById).mockResolvedValue(product);

        const result = await getProductById(
          { id: product.id },
          { session: createMockSession('buyer'), repository }
        );

        expect(result.id).toBe(product.id);
        expect(result.name).toBe('テスト商品');
        expect(result.stock).toBe(15);
      });
    });

    describe('When: 存在しない商品 ID で取得する', () => {
      it('Then: NotFoundError をスローする', async () => {
        vi.mocked(repository.findById).mockResolvedValue(null);

        await expect(
          getProductById(
            { id: '550e8400-e29b-41d4-a716-446655440999' },
            { session: createMockSession('buyer'), repository }
          )
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('When: 未公開（draft）商品を閲覧する', () => {
      it('Then: NotFoundError をスローする', async () => {
        const draftProduct = createMockProduct({ status: 'draft' });
        vi.mocked(repository.findById).mockResolvedValue(draftProduct);

        await expect(
          getProductById(
            { id: draftProduct.id },
            { session: createMockSession('buyer'), repository }
          )
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('When: アーカイブ済み商品を閲覧する', () => {
      it('Then: NotFoundError をスローする', async () => {
        const archivedProduct = createMockProduct({ status: 'archived' });
        vi.mocked(repository.findById).mockResolvedValue(archivedProduct);

        await expect(
          getProductById(
            { id: archivedProduct.id },
            { session: createMockSession('buyer'), repository }
          )
        ).rejects.toThrow(NotFoundError);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 商品検索 (getProducts + keyword)
// ─────────────────────────────────────────────────────────────────

describe('getProducts（キーワード検索）', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('Given: 購入者ユーザー', () => {
    describe('When: keyword パラメータで検索する', () => {
      it('Then: keyword パラメータが repository.findAll に渡される', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        await getProducts(
          { page: 1, limit: 12, keyword: 'Tシャツ' },
          { session: createMockSession('buyer'), repository }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ keyword: 'Tシャツ' })
        );
        expect(repository.count).toHaveBeenCalledWith('published', 'Tシャツ');
      });
    });

    describe('When: 該当商品なしの場合', () => {
      it('Then: 空配列を返す', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        const result = await getProducts(
          { page: 1, limit: 12, keyword: '存在しないキーワード' },
          { session: createMockSession('buyer'), repository }
        );

        expect(result.products).toEqual([]);
        expect(result.pagination.total).toBe(0);
      });
    });

    describe('When: keyword が空文字の場合', () => {
      it('Then: 全件を返す（keyword フィルタなし）', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([createMockProduct()]);
        vi.mocked(repository.count).mockResolvedValue(1);

        await getProducts(
          { page: 1, limit: 12, keyword: '' },
          { session: createMockSession('buyer'), repository }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ keyword: undefined })
        );
      });
    });

    describe('When: keyword が未指定の場合', () => {
      it('Then: 全件を返す（keyword フィルタなし）', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([createMockProduct()]);
        vi.mocked(repository.count).mockResolvedValue(1);

        await getProducts(
          { page: 1, limit: 12 },
          { session: createMockSession('buyer'), repository }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ keyword: undefined })
        );
      });
    });
  });
});
