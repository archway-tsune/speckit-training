/**
 * カートドメイン — リポジトリ統合テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { cartRepository, productFetcher, resetCartStore } from '@/infrastructure/repositories/cart';
import { addToCart, NotFoundError, type CartContext } from '@/domains/cart/api';
import type { Session } from '@/foundation/auth/session';
import { resetProductStore } from '@/infrastructure/repositories/product';

// ─────────────────────────────────────────────────────────────────
// Phase 2: リポジトリ統合テスト (T004)
// ─────────────────────────────────────────────────────────────────

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440099';
const PRODUCT_ID_1 = '550e8400-e29b-41d4-a716-446655440001';
const PRODUCT_ID_2 = '550e8400-e29b-41d4-a716-446655440002';

describe('CartRepository: findByUserId', () => {
  beforeEach(() => {
    resetCartStore();
  });

  it('カートが存在しない場合 null を返すこと', async () => {
    const result = await cartRepository.findByUserId(TEST_USER_ID);
    expect(result).toBeNull();
  });

  it('作成済みカートを取得できること', async () => {
    await cartRepository.create(TEST_USER_ID);
    const result = await cartRepository.findByUserId(TEST_USER_ID);
    expect(result).not.toBeNull();
    expect(result!.userId).toBe(TEST_USER_ID);
    expect(result!.items).toEqual([]);
    expect(result!.subtotal).toBe(0);
    expect(result!.itemCount).toBe(0);
  });
});

describe('CartRepository: create', () => {
  beforeEach(() => {
    resetCartStore();
  });

  it('空のカートを作成できること', async () => {
    const cart = await cartRepository.create(TEST_USER_ID);
    expect(cart.userId).toBe(TEST_USER_ID);
    expect(cart.id).toBeDefined();
    expect(cart.items).toEqual([]);
    expect(cart.subtotal).toBe(0);
    expect(cart.itemCount).toBe(0);
    expect(cart.createdAt).toBeInstanceOf(Date);
    expect(cart.updatedAt).toBeInstanceOf(Date);
  });
});

describe('CartRepository: addItem', () => {
  beforeEach(() => {
    resetCartStore();
  });

  it('カートに商品を追加できること', async () => {
    const cart = await cartRepository.addItem(TEST_USER_ID, {
      productId: PRODUCT_ID_1,
      productName: 'テスト商品A',
      price: 1000,
      imageUrl: 'https://example.com/a.jpg',
      quantity: 2,
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe(PRODUCT_ID_1);
    expect(cart.items[0].productName).toBe('テスト商品A');
    expect(cart.items[0].price).toBe(1000);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.subtotal).toBe(2000);
    expect(cart.itemCount).toBe(2);
  });

  it('同一商品を追加した場合数量が加算されること', async () => {
    await cartRepository.addItem(TEST_USER_ID, {
      productId: PRODUCT_ID_1,
      productName: 'テスト商品A',
      price: 1000,
      quantity: 1,
    });

    const cart = await cartRepository.addItem(TEST_USER_ID, {
      productId: PRODUCT_ID_1,
      productName: 'テスト商品A',
      price: 1000,
      quantity: 2,
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.subtotal).toBe(3000);
    expect(cart.itemCount).toBe(3);
  });

  it('異なる商品を追加できること', async () => {
    await cartRepository.addItem(TEST_USER_ID, {
      productId: PRODUCT_ID_1,
      productName: 'テスト商品A',
      price: 1000,
      quantity: 1,
    });

    const cart = await cartRepository.addItem(TEST_USER_ID, {
      productId: PRODUCT_ID_2,
      productName: 'テスト商品B',
      price: 2000,
      quantity: 1,
    });

    expect(cart.items).toHaveLength(2);
    expect(cart.subtotal).toBe(3000);
    expect(cart.itemCount).toBe(2);
  });

  it('カートが未作成でも addItem で自動作成されること', async () => {
    const cart = await cartRepository.addItem(TEST_USER_ID, {
      productId: PRODUCT_ID_1,
      productName: 'テスト商品A',
      price: 500,
      quantity: 1,
    });

    expect(cart.userId).toBe(TEST_USER_ID);
    expect(cart.items).toHaveLength(1);
  });
});

describe('CartRepository: updateItemQuantity', () => {
  beforeEach(() => {
    resetCartStore();
  });

  it('カートアイテムの数量を更新できること', async () => {
    await cartRepository.addItem(TEST_USER_ID, {
      productId: PRODUCT_ID_1,
      productName: 'テスト商品A',
      price: 1000,
      quantity: 1,
    });

    const cart = await cartRepository.updateItemQuantity(TEST_USER_ID, PRODUCT_ID_1, 5);
    expect(cart.items[0].quantity).toBe(5);
    expect(cart.subtotal).toBe(5000);
    expect(cart.itemCount).toBe(5);
  });

  it('存在しないカートで更新するとエラーになること', async () => {
    await expect(
      cartRepository.updateItemQuantity(TEST_USER_ID, PRODUCT_ID_1, 5)
    ).rejects.toThrow('Cart not found');
  });

  it('存在しないアイテムで更新するとエラーになること', async () => {
    await cartRepository.create(TEST_USER_ID);
    await expect(
      cartRepository.updateItemQuantity(TEST_USER_ID, PRODUCT_ID_1, 5)
    ).rejects.toThrow('Item not found');
  });
});

describe('CartRepository: removeItem', () => {
  beforeEach(() => {
    resetCartStore();
  });

  it('カートから商品を削除できること', async () => {
    await cartRepository.addItem(TEST_USER_ID, {
      productId: PRODUCT_ID_1,
      productName: 'テスト商品A',
      price: 1000,
      quantity: 2,
    });

    const cart = await cartRepository.removeItem(TEST_USER_ID, PRODUCT_ID_1);
    expect(cart.items).toHaveLength(0);
    expect(cart.subtotal).toBe(0);
    expect(cart.itemCount).toBe(0);
  });

  it('複数商品から1つだけ削除できること', async () => {
    await cartRepository.addItem(TEST_USER_ID, {
      productId: PRODUCT_ID_1,
      productName: 'テスト商品A',
      price: 1000,
      quantity: 1,
    });
    await cartRepository.addItem(TEST_USER_ID, {
      productId: PRODUCT_ID_2,
      productName: 'テスト商品B',
      price: 2000,
      quantity: 1,
    });

    const cart = await cartRepository.removeItem(TEST_USER_ID, PRODUCT_ID_1);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe(PRODUCT_ID_2);
    expect(cart.subtotal).toBe(2000);
    expect(cart.itemCount).toBe(1);
  });

  it('存在しないカートで削除するとエラーになること', async () => {
    await expect(
      cartRepository.removeItem(TEST_USER_ID, PRODUCT_ID_1)
    ).rejects.toThrow('Cart not found');
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 3: addToCart ユースケース統合テスト (T007)
// ─────────────────────────────────────────────────────────────────

const BUYER_USER_ID = '550e8400-e29b-41d4-a716-446655440100';

function createBuyerSession(): Session {
  return {
    userId: BUYER_USER_ID,
    role: 'buyer',
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function createCartContext(): CartContext {
  return {
    session: createBuyerSession(),
    repository: cartRepository,
    productFetcher,
  };
}

describe('addToCart ユースケース統合テスト', () => {
  beforeEach(() => {
    resetCartStore();
    resetProductStore();
  });

  it('実在する商品をカートに追加できること', async () => {
    const context = createCartContext();
    // ミニマルTシャツ (id: ...0001, price: 4980, stock: 25)
    const result = await addToCart(
      { productId: PRODUCT_ID_1, quantity: 1 },
      context
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].productId).toBe(PRODUCT_ID_1);
    expect(result.items[0].productName).toBe('ミニマルTシャツ');
    expect(result.items[0].price).toBe(4980);
    expect(result.items[0].quantity).toBe(1);
    expect(result.subtotal).toBe(4980);
    expect(result.itemCount).toBe(1);
  });

  it('同一商品を複数回追加すると数量が合算されること', async () => {
    const context = createCartContext();
    await addToCart({ productId: PRODUCT_ID_1, quantity: 1 }, context);
    const result = await addToCart({ productId: PRODUCT_ID_1, quantity: 2 }, context);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].quantity).toBe(3);
    expect(result.subtotal).toBe(4980 * 3);
  });

  it('異なる商品を追加できること', async () => {
    const context = createCartContext();
    await addToCart({ productId: PRODUCT_ID_1, quantity: 1 }, context);
    // レザーウォレット (id: ...0002, price: 12800)
    const result = await addToCart({ productId: PRODUCT_ID_2, quantity: 1 }, context);

    expect(result.items).toHaveLength(2);
    expect(result.subtotal).toBe(4980 + 12800);
    expect(result.itemCount).toBe(2);
  });

  it('存在しない商品を追加すると NotFoundError がスローされること', async () => {
    const context = createCartContext();
    await expect(
      addToCart(
        { productId: '550e8400-e29b-41d4-a716-446655440099', quantity: 1 },
        context
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('quantity 未指定でデフォルト1で追加されること', async () => {
    const context = createCartContext();
    const result = await addToCart(
      { productId: PRODUCT_ID_1 },
      context
    );

    expect(result.items[0].quantity).toBe(1);
  });
});
