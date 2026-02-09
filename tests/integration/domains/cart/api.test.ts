/**
 * Cart ドメイン - API統合テスト
 * 契約スキーマとの整合性検証
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import {
  GetCartOutputSchema,
  AddToCartInputSchema,
  AddToCartOutputSchema,
  UpdateCartItemInputSchema,
  UpdateCartItemOutputSchema,
  RemoveFromCartOutputSchema,
  type Cart,
  type CartRepository,
  type ProductFetcher,
} from '@/contracts/cart';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} from '@/domains/cart/api';

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
// 契約検証テスト
// ─────────────────────────────────────────────────────────────────

describe('Cart API統合テスト（本番ドメイン）', () => {
  let repository: CartRepository;
  let productFetcher: ProductFetcher;

  beforeEach(() => {
    repository = createMockRepository();
    productFetcher = createMockProductFetcher();
  });

  describe('getCart', () => {
    it('出力スキーマ（GetCartOutputSchema）に準拠したレスポンスを返す', async () => {
      const cart = createMockCart({
        items: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440002',
            productName: 'テスト商品',
            price: 1000,
            quantity: 2,
            addedAt: new Date(),
          },
        ],
        subtotal: 2000,
        itemCount: 2,
      });
      vi.mocked(repository.findByUserId).mockResolvedValue(cart);

      const result = await getCart(
        {},
        { session: createMockSession(), repository, productFetcher }
      );

      const validated = GetCartOutputSchema.parse(result);
      expect(validated.items).toHaveLength(1);
      expect(validated.subtotal).toBe(2000);
    });
  });

  describe('addToCart', () => {
    it('入力スキーマに準拠したリクエストを処理できる', async () => {
      const rawInput = {
        productId: '550e8400-e29b-41d4-a716-446655440002',
        quantity: 2,
      };
      const validatedInput = AddToCartInputSchema.parse(rawInput);

      const product = { id: validatedInput.productId, name: 'テスト', price: 1000, stock: 10 };
      vi.mocked(productFetcher.findById).mockResolvedValue(product);
      vi.mocked(repository.addItem).mockResolvedValue(createMockCart());

      await expect(
        addToCart(validatedInput, { session: createMockSession(), repository, productFetcher })
      ).resolves.not.toThrow();
    });

    it('出力スキーマ（AddToCartOutputSchema）に準拠したレスポンスを返す', async () => {
      const cart = createMockCart({
        items: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440002',
            productName: 'テスト商品',
            price: 1000,
            quantity: 1,
            addedAt: new Date(),
          },
        ],
        subtotal: 1000,
        itemCount: 1,
      });
      const product = { id: '550e8400-e29b-41d4-a716-446655440002', name: 'テスト商品', price: 1000, stock: 10 };

      vi.mocked(productFetcher.findById).mockResolvedValue(product);
      vi.mocked(repository.addItem).mockResolvedValue(cart);

      const result = await addToCart(
        { productId: product.id, quantity: 1 },
        { session: createMockSession(), repository, productFetcher }
      );

      const validated = AddToCartOutputSchema.parse(result);
      expect(validated.items).toHaveLength(1);
    });

    it('入力スキーマのバリデーションメッセージを返す', () => {
      const invalidInput = {
        productId: 'invalid-uuid',
        quantity: 1,
      };

      const parseResult = AddToCartInputSchema.safeParse(invalidInput);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        const error = parseResult.error.errors[0];
        expect(error.message).toBe('有効な商品IDを指定してください');
      }
    });
  });

  describe('updateCartItem', () => {
    it('入力スキーマのバリデーションメッセージを返す', () => {
      const invalidInput = {
        productId: '550e8400-e29b-41d4-a716-446655440002',
        quantity: 0,
      };

      const parseResult = UpdateCartItemInputSchema.safeParse(invalidInput);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        const error = parseResult.error.errors[0];
        expect(error.message).toBe('数量は1以上で指定してください');
      }
    });

    it('出力スキーマ（UpdateCartItemOutputSchema）に準拠したレスポンスを返す', async () => {
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
      vi.mocked(productFetcher.findById).mockResolvedValue({
        id: productId, name: 'テスト商品', price: 1000, stock: 10,
      });

      const result = await updateCartItem(
        { productId, quantity: 3 },
        { session: createMockSession(), repository, productFetcher }
      );

      const validated = UpdateCartItemOutputSchema.parse(result);
      expect(validated.items[0].quantity).toBe(3);
    });
  });

  describe('removeFromCart', () => {
    it('出力スキーマ（RemoveFromCartOutputSchema）に準拠したレスポンスを返す', async () => {
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
      const emptyCart = createMockCart();

      vi.mocked(repository.findByUserId).mockResolvedValue(existingCart);
      vi.mocked(repository.removeItem).mockResolvedValue(emptyCart);

      const result = await removeFromCart(
        { productId },
        { session: createMockSession(), repository, productFetcher }
      );

      const validated = RemoveFromCartOutputSchema.parse(result);
      expect(validated.items).toHaveLength(0);
    });
  });

  describe('実際のユースケースシナリオ', () => {
    it('商品追加 → 数量更新 → 削除 の流れが正常に動作する', async () => {
      const productId = '550e8400-e29b-41d4-a716-446655440002';
      const product = { id: productId, name: 'テスト商品', price: 1000, stock: 10 };

      const cartWithItem = createMockCart({
        items: [
          {
            productId,
            productName: product.name,
            price: product.price,
            quantity: 1,
            addedAt: new Date(),
          },
        ],
        subtotal: 1000,
        itemCount: 1,
      });
      const cartUpdated = createMockCart({
        items: [
          {
            productId,
            productName: product.name,
            price: product.price,
            quantity: 3,
            addedAt: new Date(),
          },
        ],
        subtotal: 3000,
        itemCount: 3,
      });
      const cartAfterRemove = createMockCart();

      vi.mocked(productFetcher.findById).mockResolvedValue(product);
      vi.mocked(repository.addItem).mockResolvedValue(cartWithItem);
      vi.mocked(repository.findByUserId).mockResolvedValue(cartWithItem);
      vi.mocked(repository.updateItemQuantity).mockResolvedValue(cartUpdated);
      vi.mocked(repository.removeItem).mockResolvedValue(cartAfterRemove);

      // 1. 商品追加
      const afterAdd = await addToCart(
        { productId, quantity: 1 },
        { session: createMockSession(), repository, productFetcher }
      );
      expect(afterAdd.items).toHaveLength(1);
      AddToCartOutputSchema.parse(afterAdd);

      // 2. 数量更新
      const afterUpdate = await updateCartItem(
        { productId, quantity: 3 },
        { session: createMockSession(), repository, productFetcher }
      );
      expect(afterUpdate.items[0].quantity).toBe(3);
      UpdateCartItemOutputSchema.parse(afterUpdate);

      // 3. 削除
      const afterRemove = await removeFromCart(
        { productId },
        { session: createMockSession(), repository, productFetcher }
      );
      expect(afterRemove.items).toHaveLength(0);
      RemoveFromCartOutputSchema.parse(afterRemove);
    });
  });
});
