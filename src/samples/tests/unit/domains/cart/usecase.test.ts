/**
 * Cart ドメイン - ユースケース単体テスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import { AuthorizationError } from '@/foundation/auth/authorize';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  CartItemNotFoundError,
  NotFoundError,
  type CartRepository,
  type ProductFetcher,
} from '@/samples/domains/cart/api/usecases';
import type { Cart } from '@/contracts/cart';

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

function createMockSession(role: 'buyer' | 'admin' = 'buyer'): Session {
  return {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    role,
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function createMockCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    items: [],
    subtotal: 0,
    itemCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockRepository(): CartRepository {
  return {
    findByUserId: vi.fn(),
    create: vi.fn(),
    addItem: vi.fn(),
    updateItemQuantity: vi.fn(),
    removeItem: vi.fn(),
  };
}

function createMockProductFetcher(): ProductFetcher {
  return {
    findById: vi.fn(),
  };
}

// ─────────────────────────────────────────────────────────────────
// カート取得
// ─────────────────────────────────────────────────────────────────

describe('getCart', () => {
  let repository: CartRepository;
  let productFetcher: ProductFetcher;

  beforeEach(() => {
    repository = createMockRepository();
    productFetcher = createMockProductFetcher();
  });

  describe('Given: buyerユーザー', () => {
    describe('When: カートを取得する', () => {
      it('Then: 既存のカートを返す', async () => {
        const cart = createMockCart();
        vi.mocked(repository.findByUserId).mockResolvedValue(cart);

        const result = await getCart({}, {
          session: createMockSession('buyer'),
          repository,
          productFetcher,
        });

        expect(result.id).toBe(cart.id);
      });

      it('Then: カートが存在しない場合は新規作成する', async () => {
        const newCart = createMockCart();
        vi.mocked(repository.findByUserId).mockResolvedValue(null);
        vi.mocked(repository.create).mockResolvedValue(newCart);

        const result = await getCart({}, {
          session: createMockSession('buyer'),
          repository,
          productFetcher,
        });

        expect(repository.create).toHaveBeenCalled();
        expect(result.id).toBe(newCart.id);
      });
    });
  });

  describe('Given: adminユーザー', () => {
    describe('When: カートを取得する', () => {
      it('Then: adminもbuyer権限を持つためカートを取得できる', async () => {
        const cart = createMockCart();
        vi.mocked(repository.findByUserId).mockResolvedValue(cart);

        const result = await getCart({}, {
          session: createMockSession('admin'),
          repository,
          productFetcher,
        });

        expect(result.id).toBe(cart.id);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// カート追加
// ─────────────────────────────────────────────────────────────────

describe('addToCart', () => {
  let repository: CartRepository;
  let productFetcher: ProductFetcher;

  beforeEach(() => {
    repository = createMockRepository();
    productFetcher = createMockProductFetcher();
  });

  describe('Given: buyerユーザーと存在する商品', () => {
    describe('When: カートに追加する', () => {
      it('Then: 商品が追加されたカートを返す', async () => {
        const product = {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'テスト商品',
          price: 1000,
        };
        const cart = createMockCart({
          items: [
            {
              productId: product.id,
              productName: product.name,
              price: product.price,
              quantity: 1,
              addedAt: new Date(),
            },
          ],
          subtotal: 1000,
          itemCount: 1,
        });

        vi.mocked(productFetcher.findById).mockResolvedValue(product);
        vi.mocked(repository.addItem).mockResolvedValue(cart);

        const result = await addToCart(
          { productId: product.id, quantity: 1 },
          { session: createMockSession('buyer'), repository, productFetcher }
        );

        expect(result.items).toHaveLength(1);
        expect(result.items[0].productName).toBe('テスト商品');
      });
    });
  });

  describe('Given: 存在しない商品', () => {
    describe('When: カートに追加しようとする', () => {
      it('Then: NotFoundErrorをスローする', async () => {
        vi.mocked(productFetcher.findById).mockResolvedValue(null);

        await expect(
          addToCart(
            { productId: '550e8400-e29b-41d4-a716-446655440099', quantity: 1 },
            { session: createMockSession('buyer'), repository, productFetcher }
          )
        ).rejects.toThrow(NotFoundError);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// カート更新
// ─────────────────────────────────────────────────────────────────

describe('updateCartItem', () => {
  let repository: CartRepository;
  let productFetcher: ProductFetcher;

  beforeEach(() => {
    repository = createMockRepository();
    productFetcher = createMockProductFetcher();
  });

  describe('Given: カート内の商品', () => {
    describe('When: 数量を更新する', () => {
      it('Then: 更新されたカートを返す', async () => {
        const productId = '550e8400-e29b-41d4-a716-446655440002';
        const existingCart = createMockCart({
          items: [
            {
              productId,
              productName: 'テスト商品',
              price: 1000,
              quantity: 1,
              addedAt: new Date(),
            },
          ],
        });
        const updatedCart = createMockCart({
          items: [
            {
              productId,
              productName: 'テスト商品',
              price: 1000,
              quantity: 3,
              addedAt: new Date(),
            },
          ],
          subtotal: 3000,
          itemCount: 3,
        });

        vi.mocked(repository.findByUserId).mockResolvedValue(existingCart);
        vi.mocked(repository.updateItemQuantity).mockResolvedValue(updatedCart);

        const result = await updateCartItem(
          { productId, quantity: 3 },
          { session: createMockSession('buyer'), repository, productFetcher }
        );

        expect(result.items[0].quantity).toBe(3);
      });
    });
  });

  describe('Given: カート内に存在しない商品', () => {
    describe('When: 更新しようとする', () => {
      it('Then: CartItemNotFoundErrorをスローする', async () => {
        vi.mocked(repository.findByUserId).mockResolvedValue(createMockCart());

        await expect(
          updateCartItem(
            { productId: '550e8400-e29b-41d4-a716-446655440099', quantity: 2 },
            { session: createMockSession('buyer'), repository, productFetcher }
          )
        ).rejects.toThrow(CartItemNotFoundError);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// カート削除
// ─────────────────────────────────────────────────────────────────

describe('removeFromCart', () => {
  let repository: CartRepository;
  let productFetcher: ProductFetcher;

  beforeEach(() => {
    repository = createMockRepository();
    productFetcher = createMockProductFetcher();
  });

  describe('Given: カート内の商品', () => {
    describe('When: 削除する', () => {
      it('Then: 商品が削除されたカートを返す', async () => {
        const productId = '550e8400-e29b-41d4-a716-446655440002';
        const existingCart = createMockCart({
          items: [
            {
              productId,
              productName: 'テスト商品',
              price: 1000,
              quantity: 1,
              addedAt: new Date(),
            },
          ],
        });
        const updatedCart = createMockCart();

        vi.mocked(repository.findByUserId).mockResolvedValue(existingCart);
        vi.mocked(repository.removeItem).mockResolvedValue(updatedCart);

        const result = await removeFromCart(
          { productId },
          { session: createMockSession('buyer'), repository, productFetcher }
        );

        expect(result.items).toHaveLength(0);
      });
    });
  });

  describe('Given: カート内に存在しない商品', () => {
    describe('When: 削除しようとする', () => {
      it('Then: CartItemNotFoundErrorをスローする', async () => {
        vi.mocked(repository.findByUserId).mockResolvedValue(createMockCart());

        await expect(
          removeFromCart(
            { productId: '550e8400-e29b-41d4-a716-446655440099' },
            { session: createMockSession('buyer'), repository, productFetcher }
          )
        ).rejects.toThrow(CartItemNotFoundError);
      });
    });
  });
});
