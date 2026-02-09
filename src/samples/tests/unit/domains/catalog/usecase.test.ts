/**
 * Catalog ドメイン - ユースケース単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import { AuthorizationError } from '@/foundation/auth/authorize';
import { ValidationError } from '@/foundation/validation/runtime';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductRepository,
} from '@/samples/domains/catalog/api/usecases';
import type { Product } from '@/contracts/catalog';

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

  describe('Given: 認証済みユーザー', () => {
    describe('When: 商品一覧を取得する', () => {
      it('Then: ページネーション付きで商品リストを返す', async () => {
        const products = [createMockProduct(), createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', name: '商品2' })];
        vi.mocked(repository.findAll).mockResolvedValue(products);
        vi.mocked(repository.count).mockResolvedValue(2);

        const result = await getProducts(
          { page: 1, limit: 20 },
          { session: createMockSession(), repository }
        );

        expect(result.products).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
        expect(result.pagination.page).toBe(1);
      });

      it('Then: デフォルトでpublished商品のみを返す（buyer）', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        await getProducts(
          { page: 1, limit: 20 },
          { session: createMockSession('buyer'), repository }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'published' })
        );
      });
    });
  });

  describe('Given: 管理者ユーザー', () => {
    describe('When: draft商品を含めて取得する', () => {
      it('Then: 指定したステータスでフィルタリングする', async () => {
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
});

// ─────────────────────────────────────────────────────────────────
// 商品詳細取得 (getProductById)
// ─────────────────────────────────────────────────────────────────

describe('getProductById', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('Given: 存在する商品ID', () => {
    describe('When: 商品詳細を取得する', () => {
      it('Then: 商品情報を返す', async () => {
        const product = createMockProduct();
        vi.mocked(repository.findById).mockResolvedValue(product);

        const result = await getProductById(
          { id: product.id },
          { session: createMockSession(), repository }
        );

        expect(result.id).toBe(product.id);
        expect(result.name).toBe('テスト商品');
      });
    });
  });

  describe('Given: 存在しない商品ID', () => {
    describe('When: 商品詳細を取得する', () => {
      it('Then: NotFoundErrorをスローする', async () => {
        vi.mocked(repository.findById).mockResolvedValue(null);

        await expect(
          getProductById(
            { id: '550e8400-e29b-41d4-a716-446655440999' },
            { session: createMockSession(), repository }
          )
        ).rejects.toThrow('商品が見つかりません');
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 商品登録 (createProduct)
// ─────────────────────────────────────────────────────────────────

describe('createProduct', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('Given: 管理者ユーザー', () => {
    describe('When: 有効な商品データで登録する', () => {
      it('Then: 商品を作成して返す', async () => {
        const newProduct = createMockProduct();
        vi.mocked(repository.create).mockResolvedValue(newProduct);

        const result = await createProduct(
          { name: 'テスト商品', price: 1000 },
          { session: createMockSession('admin'), repository }
        );

        expect(result.name).toBe('テスト商品');
        expect(repository.create).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'テスト商品', price: 1000 })
        );
      });
    });

    describe('When: 不正な価格で登録する', () => {
      it('Then: ValidationErrorをスローする', async () => {
        await expect(
          createProduct(
            { name: 'テスト', price: -100 },
            { session: createMockSession('admin'), repository }
          )
        ).rejects.toThrow(ValidationError);
      });
    });
  });

  describe('Given: 購入者ユーザー', () => {
    describe('When: 商品を登録しようとする', () => {
      it('Then: AuthorizationErrorをスローする', async () => {
        await expect(
          createProduct(
            { name: 'テスト', price: 1000 },
            { session: createMockSession('buyer'), repository }
          )
        ).rejects.toThrow(AuthorizationError);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 商品更新 (updateProduct)
// ─────────────────────────────────────────────────────────────────

describe('updateProduct', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('Given: 管理者ユーザーと存在する商品', () => {
    describe('When: 商品情報を更新する', () => {
      it('Then: 更新された商品を返す', async () => {
        const existing = createMockProduct();
        const updated = { ...existing, name: '更新後商品' };
        vi.mocked(repository.findById).mockResolvedValue(existing);
        vi.mocked(repository.update).mockResolvedValue(updated);

        const result = await updateProduct(
          { id: existing.id, name: '更新後商品' },
          { session: createMockSession('admin'), repository }
        );

        expect(result.name).toBe('更新後商品');
      });
    });
  });

  describe('Given: 存在しない商品', () => {
    describe('When: 更新しようとする', () => {
      it('Then: NotFoundErrorをスローする', async () => {
        vi.mocked(repository.findById).mockResolvedValue(null);

        await expect(
          updateProduct(
            { id: '550e8400-e29b-41d4-a716-446655440999', name: '更新' },
            { session: createMockSession('admin'), repository }
          )
        ).rejects.toThrow('商品が見つかりません');
      });
    });
  });

  describe('Given: 購入者ユーザー', () => {
    describe('When: 商品を更新しようとする', () => {
      it('Then: AuthorizationErrorをスローする', async () => {
        await expect(
          updateProduct(
            { id: '550e8400-e29b-41d4-a716-446655440000', name: '更新' },
            { session: createMockSession('buyer'), repository }
          )
        ).rejects.toThrow(AuthorizationError);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 商品削除 (deleteProduct)
// ─────────────────────────────────────────────────────────────────

describe('deleteProduct', () => {
  let repository: ProductRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  describe('Given: 管理者ユーザーと存在する商品', () => {
    describe('When: 商品を削除する', () => {
      it('Then: 成功レスポンスを返す', async () => {
        vi.mocked(repository.findById).mockResolvedValue(createMockProduct());
        vi.mocked(repository.delete).mockResolvedValue();

        const result = await deleteProduct(
          { id: '550e8400-e29b-41d4-a716-446655440000' },
          { session: createMockSession('admin'), repository }
        );

        expect(result.success).toBe(true);
        expect(repository.delete).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
      });
    });
  });

  describe('Given: 存在しない商品', () => {
    describe('When: 削除しようとする', () => {
      it('Then: NotFoundErrorをスローする', async () => {
        vi.mocked(repository.findById).mockResolvedValue(null);

        await expect(
          deleteProduct(
            { id: '550e8400-e29b-41d4-a716-446655440999' },
            { session: createMockSession('admin'), repository }
          )
        ).rejects.toThrow('商品が見つかりません');
      });
    });
  });

  describe('Given: 購入者ユーザー', () => {
    describe('When: 商品を削除しようとする', () => {
      it('Then: AuthorizationErrorをスローする', async () => {
        await expect(
          deleteProduct(
            { id: '550e8400-e29b-41d4-a716-446655440000' },
            { session: createMockSession('buyer'), repository }
          )
        ).rejects.toThrow(AuthorizationError);
      });
    });
  });
});
