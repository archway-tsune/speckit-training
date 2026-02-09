/**
 * Product ドメイン - ユースケース単体テスト
 * TDD Red フェーズ: テストを先に書き、失敗を確認してから実装に着手する
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import type { Product, ProductRepository } from '@/contracts/product';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  NotFoundError,
} from '@/domains/product/api';

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

function createMockSession(role: 'buyer' | 'admin' = 'admin'): Session {
  return {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    role,
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '660e8400-e29b-41d4-a716-446655440001',
    name: 'テスト商品',
    price: 1000,
    stock: 10,
    description: 'テスト用の商品です',
    imageUrl: 'https://example.com/image.jpg',
    status: 'draft',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
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
// T005: getProducts
// ─────────────────────────────────────────────────────────────────

describe('getProducts', () => {
  let repository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it('管理者が全商品を取得できる（ページネーション付き）', async () => {
    const products = [createMockProduct(), createMockProduct({ id: '770e8400-e29b-41d4-a716-446655440002' })];
    vi.mocked(repository.findAll).mockResolvedValue(products);
    vi.mocked(repository.count).mockResolvedValue(2);

    const result = await getProducts(
      { page: '1', limit: '20' },
      { session: createMockSession('admin'), repository }
    );

    expect(result.products).toHaveLength(2);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
  });

  it('デフォルト20件/ページでページネーションする', async () => {
    vi.mocked(repository.findAll).mockResolvedValue([]);
    vi.mocked(repository.count).mockResolvedValue(45);

    const result = await getProducts(
      { page: '1' },
      { session: createMockSession('admin'), repository }
    );

    expect(result.pagination.limit).toBe(20);
    expect(result.pagination.totalPages).toBe(3);
    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0, limit: 20 })
    );
  });

  it('ステータスフィルタを適用できる', async () => {
    vi.mocked(repository.findAll).mockResolvedValue([]);
    vi.mocked(repository.count).mockResolvedValue(0);

    await getProducts(
      { page: '1', limit: '20', status: 'published' },
      { session: createMockSession('admin'), repository }
    );

    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' })
    );
  });

  it('管理者は全ステータスの商品を取得できる', async () => {
    vi.mocked(repository.findAll).mockResolvedValue([]);
    vi.mocked(repository.count).mockResolvedValue(0);

    await getProducts(
      { page: '1', limit: '20' },
      { session: createMockSession('admin'), repository }
    );

    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: undefined })
    );
  });

  it('buyer は ForbiddenError がスローされる', async () => {
    await expect(
      getProducts(
        { page: '1', limit: '20' },
        { session: createMockSession('buyer'), repository }
      )
    ).rejects.toThrow('権限がありません');
  });
});

// ─────────────────────────────────────────────────────────────────
// T006: getProductById
// ─────────────────────────────────────────────────────────────────

describe('getProductById', () => {
  let repository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it('管理者がIDで商品を取得できる', async () => {
    const product = createMockProduct();
    vi.mocked(repository.findById).mockResolvedValue(product);

    const result = await getProductById(
      { id: product.id },
      { session: createMockSession('admin'), repository }
    );

    expect(result).toEqual(product);
    expect(repository.findById).toHaveBeenCalledWith(product.id);
  });

  it('存在しないIDでNotFoundErrorがスローされる', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(
      getProductById(
        { id: '660e8400-e29b-41d4-a716-446655440099' },
        { session: createMockSession('admin'), repository }
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('buyer は ForbiddenError がスローされる', async () => {
    await expect(
      getProductById(
        { id: '660e8400-e29b-41d4-a716-446655440001' },
        { session: createMockSession('buyer'), repository }
      )
    ).rejects.toThrow('権限がありません');
  });
});

// ─────────────────────────────────────────────────────────────────
// T007: createProduct
// ─────────────────────────────────────────────────────────────────

describe('createProduct', () => {
  let repository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it('必須項目のみで商品を登録でき、draftステータスで作成される', async () => {
    const created = createMockProduct({ status: 'draft' });
    vi.mocked(repository.create).mockResolvedValue(created);

    const result = await createProduct(
      { name: 'テスト商品', price: 1500 },
      { session: createMockSession('admin'), repository }
    );

    expect(result).toEqual(created);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'テスト商品',
        price: 1500,
        stock: 0,
        status: 'draft',
      })
    );
  });

  it('全項目を指定して商品を登録できる', async () => {
    const created = createMockProduct();
    vi.mocked(repository.create).mockResolvedValue(created);

    const result = await createProduct(
      {
        name: 'テスト商品',
        price: 1500,
        stock: 10,
        description: '説明文',
        imageUrl: 'https://example.com/image.jpg',
      },
      { session: createMockSession('admin'), repository }
    );

    expect(result).toEqual(created);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'テスト商品',
        price: 1500,
        stock: 10,
        description: '説明文',
        imageUrl: 'https://example.com/image.jpg',
        status: 'draft',
      })
    );
  });

  it('商品名が空の場合にバリデーションエラーがスローされる', async () => {
    await expect(
      createProduct(
        { name: '', price: 1500 },
        { session: createMockSession('admin'), repository }
      )
    ).rejects.toThrow();
  });

  it('価格が負の値の場合にバリデーションエラーがスローされる', async () => {
    await expect(
      createProduct(
        { name: 'テスト商品', price: -100 },
        { session: createMockSession('admin'), repository }
      )
    ).rejects.toThrow();
  });

  it('buyer は ForbiddenError がスローされる', async () => {
    await expect(
      createProduct(
        { name: 'テスト商品', price: 1500 },
        { session: createMockSession('buyer'), repository }
      )
    ).rejects.toThrow('権限がありません');
  });
});

// ─────────────────────────────────────────────────────────────────
// T008: updateProduct
// ─────────────────────────────────────────────────────────────────

describe('updateProduct', () => {
  let repository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it('部分更新で商品名のみ更新できる', async () => {
    const existing = createMockProduct();
    const updated = createMockProduct({ name: '更新後の商品名' });
    vi.mocked(repository.findById).mockResolvedValue(existing);
    vi.mocked(repository.update).mockResolvedValue(updated);

    const result = await updateProduct(
      { id: existing.id, name: '更新後の商品名' },
      { session: createMockSession('admin'), repository }
    );

    expect(result.name).toBe('更新後の商品名');
    expect(repository.update).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({ name: '更新後の商品名' })
    );
  });

  it('存在しないIDでNotFoundErrorがスローされる', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(
      updateProduct(
        { id: '660e8400-e29b-41d4-a716-446655440099', name: 'テスト' },
        { session: createMockSession('admin'), repository }
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('商品名が201文字の場合にバリデーションエラーがスローされる', async () => {
    await expect(
      updateProduct(
        { id: '660e8400-e29b-41d4-a716-446655440001', name: 'a'.repeat(201) },
        { session: createMockSession('admin'), repository }
      )
    ).rejects.toThrow();
  });

  it('buyer は ForbiddenError がスローされる', async () => {
    await expect(
      updateProduct(
        { id: '660e8400-e29b-41d4-a716-446655440001', name: 'テスト' },
        { session: createMockSession('buyer'), repository }
      )
    ).rejects.toThrow('権限がありません');
  });
});

// ─────────────────────────────────────────────────────────────────
// T009: updateProductStatus
// ─────────────────────────────────────────────────────────────────

describe('updateProductStatus', () => {
  let repository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it('draft から published に変更できる', async () => {
    const existing = createMockProduct({ status: 'draft' });
    const updated = createMockProduct({ status: 'published' });
    vi.mocked(repository.findById).mockResolvedValue(existing);
    vi.mocked(repository.update).mockResolvedValue(updated);

    const result = await updateProductStatus(
      { id: existing.id, status: 'published' },
      { session: createMockSession('admin'), repository }
    );

    expect(result.status).toBe('published');
  });

  it('published から archived に変更できる', async () => {
    const existing = createMockProduct({ status: 'published' });
    const updated = createMockProduct({ status: 'archived' });
    vi.mocked(repository.findById).mockResolvedValue(existing);
    vi.mocked(repository.update).mockResolvedValue(updated);

    const result = await updateProductStatus(
      { id: existing.id, status: 'archived' },
      { session: createMockSession('admin'), repository }
    );

    expect(result.status).toBe('archived');
  });

  it('archived から draft に変更できる', async () => {
    const existing = createMockProduct({ status: 'archived' });
    const updated = createMockProduct({ status: 'draft' });
    vi.mocked(repository.findById).mockResolvedValue(existing);
    vi.mocked(repository.update).mockResolvedValue(updated);

    const result = await updateProductStatus(
      { id: existing.id, status: 'draft' },
      { session: createMockSession('admin'), repository }
    );

    expect(result.status).toBe('draft');
  });

  it('無効なステータス値でバリデーションエラーがスローされる', async () => {
    await expect(
      updateProductStatus(
        { id: '660e8400-e29b-41d4-a716-446655440001', status: 'invalid' },
        { session: createMockSession('admin'), repository }
      )
    ).rejects.toThrow();
  });

  it('存在しないIDでNotFoundErrorがスローされる', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(
      updateProductStatus(
        { id: '660e8400-e29b-41d4-a716-446655440099', status: 'published' },
        { session: createMockSession('admin'), repository }
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('buyer は ForbiddenError がスローされる', async () => {
    await expect(
      updateProductStatus(
        { id: '660e8400-e29b-41d4-a716-446655440001', status: 'published' },
        { session: createMockSession('buyer'), repository }
      )
    ).rejects.toThrow('権限がありません');
  });
});

// ─────────────────────────────────────────────────────────────────
// T010: deleteProduct
// ─────────────────────────────────────────────────────────────────

describe('deleteProduct', () => {
  let repository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it('管理者が商品を削除できる', async () => {
    const product = createMockProduct();
    vi.mocked(repository.findById).mockResolvedValue(product);
    vi.mocked(repository.delete).mockResolvedValue();

    const result = await deleteProduct(
      { id: product.id },
      { session: createMockSession('admin'), repository }
    );

    expect(result).toEqual({ success: true });
    expect(repository.delete).toHaveBeenCalledWith(product.id);
  });

  it('存在しないIDでNotFoundErrorがスローされる', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(
      deleteProduct(
        { id: '660e8400-e29b-41d4-a716-446655440099' },
        { session: createMockSession('admin'), repository }
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('buyer は ForbiddenError がスローされる', async () => {
    await expect(
      deleteProduct(
        { id: '660e8400-e29b-41d4-a716-446655440001' },
        { session: createMockSession('buyer'), repository }
      )
    ).rejects.toThrow('権限がありません');
  });
});
