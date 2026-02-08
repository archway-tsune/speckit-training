/**
 * カタログドメイン — コントラクト・ユースケース単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi } from 'vitest';
import {
  ProductSchema,
  GetProductsInputSchema,
  CreateProductInputSchema,
  UpdateProductInputSchema,
  type Product,
  type ProductRepository,
} from '@/contracts/catalog';
import { getProducts, getProductById, NotFoundError, type CatalogContext } from '@/domains/catalog/api';
import type { Session } from '@/foundation/auth/session';

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'テスト商品',
    price: 1000,
    description: 'テスト説明',
    imageUrl: 'https://example.com/image.jpg',
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  };
}

function createMockSession(role: 'buyer' | 'admin' = 'buyer'): Session {
  return {
    userId: 'user-123',
    role,
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function createMockRepository(): ProductRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  };
}

describe('コントラクト: ProductSchema', () => {
  const validProduct = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'テスト商品',
    price: 1000,
    description: 'テスト説明',
    imageUrl: 'https://example.com/image.jpg',
    stock: 10,
    status: 'published' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('stock フィールド（0以上の整数）を受け入れること', () => {
    const result = ProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock).toBe(10);
    }
  });

  it('stock フィールドが未指定の場合デフォルト0になること', () => {
    const { stock, ...withoutStock } = validProduct;
    const result = ProductSchema.safeParse(withoutStock);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock).toBe(0);
    }
  });

  it('stock が負の値の場合バリデーションエラーになること', () => {
    const result = ProductSchema.safeParse({ ...validProduct, stock: -1 });
    expect(result.success).toBe(false);
  });

  it('stock が小数の場合バリデーションエラーになること', () => {
    const result = ProductSchema.safeParse({ ...validProduct, stock: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe('コントラクト: GetProductsInputSchema', () => {
  it('keyword フィールド（最大200文字、任意）を受け入れること', () => {
    const result = GetProductsInputSchema.safeParse({ keyword: 'テスト' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keyword).toBe('テスト');
    }
  });

  it('keyword が未指定の場合 undefined になること', () => {
    const result = GetProductsInputSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keyword).toBeUndefined();
    }
  });

  it('keyword が200文字を超える場合バリデーションエラーになること', () => {
    const result = GetProductsInputSchema.safeParse({ keyword: 'あ'.repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe('コントラクト: CreateProductInputSchema', () => {
  it('stock フィールドを受け入れること', () => {
    const result = CreateProductInputSchema.safeParse({
      name: 'テスト商品',
      price: 1000,
      stock: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock).toBe(50);
    }
  });

  it('stock が未指定の場合デフォルト0になること', () => {
    const result = CreateProductInputSchema.safeParse({
      name: 'テスト商品',
      price: 1000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock).toBe(0);
    }
  });

  it('stock が負の値の場合バリデーションエラーになること', () => {
    const result = CreateProductInputSchema.safeParse({
      name: 'テスト商品',
      price: 1000,
      stock: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe('コントラクト: UpdateProductInputSchema', () => {
  it('stock フィールド（任意）を受け入れること', () => {
    const result = UpdateProductInputSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      stock: 20,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock).toBe(20);
    }
  });

  it('stock が未指定でもバリデーション成功すること', () => {
    const result = UpdateProductInputSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock).toBeUndefined();
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// ユースケース: getProducts
// ─────────────────────────────────────────────────────────────────

describe('ユースケース: getProducts', () => {
  it('buyer ロールで published 商品のみ取得できること', async () => {
    const publishedProduct = createMockProduct({ status: 'published' });
    const repo = createMockRepository();
    (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([publishedProduct]);
    (repo.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const context: CatalogContext = {
      session: createMockSession('buyer'),
      repository: repo,
    };

    const result = await getProducts({ page: 1, limit: 20 }, context);
    expect(result.products).toHaveLength(1);
    expect(result.products[0].status).toBe('published');
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' })
    );
  });

  it('ページネーション（page, limit）が正しく動作すること', async () => {
    const products = Array.from({ length: 5 }, (_, i) =>
      createMockProduct({ id: `550e8400-e29b-41d4-a716-44665544000${i}` })
    );
    const repo = createMockRepository();
    (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(products);
    (repo.count as ReturnType<typeof vi.fn>).mockResolvedValue(15);

    const context: CatalogContext = {
      session: createMockSession('buyer'),
      repository: repo,
    };

    const result = await getProducts({ page: 2, limit: 5 }, context);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(5);
    expect(result.pagination.total).toBe(15);
    expect(result.pagination.totalPages).toBe(3);
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 5, limit: 5 })
    );
  });

  it('keyword が指定された場合リポジトリに渡されること', async () => {
    const repo = createMockRepository();
    (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (repo.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const context: CatalogContext = {
      session: createMockSession('buyer'),
      repository: repo,
    };

    await getProducts({ page: 1, limit: 20, keyword: 'テスト' }, context);
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: 'テスト' })
    );
  });

  it('商品が0件の場合空配列と pagination.total=0 を返すこと', async () => {
    const repo = createMockRepository();
    (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (repo.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const context: CatalogContext = {
      session: createMockSession('buyer'),
      repository: repo,
    };

    const result = await getProducts({ page: 1, limit: 20 }, context);
    expect(result.products).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// ユースケース: getProductById
// ─────────────────────────────────────────────────────────────────

describe('ユースケース: getProductById', () => {
  it('存在する商品IDで商品情報（stock含む）が返ること', async () => {
    const product = createMockProduct({ stock: 25 });
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(product);

    const context: CatalogContext = {
      session: createMockSession('buyer'),
      repository: repo,
    };

    const result = await getProductById({ id: product.id }, context);
    expect(result.id).toBe(product.id);
    expect(result.stock).toBe(25);
  });

  it('存在しない商品IDで NotFoundError がスローされること', async () => {
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const context: CatalogContext = {
      session: createMockSession('buyer'),
      repository: repo,
    };

    await expect(
      getProductById({ id: '550e8400-e29b-41d4-a716-446655440099' }, context)
    ).rejects.toThrow(NotFoundError);
  });

  it('buyer ロールで draft 商品にアクセスすると NotFoundError がスローされること', async () => {
    const draftProduct = createMockProduct({ status: 'draft' });
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(draftProduct);

    const context: CatalogContext = {
      session: createMockSession('buyer'),
      repository: repo,
    };

    await expect(
      getProductById({ id: draftProduct.id }, context)
    ).rejects.toThrow(NotFoundError);
  });

  it('返却される商品に stock フィールドが含まれること', async () => {
    const product = createMockProduct({ stock: 0 });
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(product);

    const context: CatalogContext = {
      session: createMockSession('buyer'),
      repository: repo,
    };

    const result = await getProductById({ id: product.id }, context);
    expect(result).toHaveProperty('stock');
    expect(result.stock).toBe(0);
  });
});
