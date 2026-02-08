/**
 * 注文ドメイン — リポジトリ・ユースケース統合テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { orderRepository, cartFetcher, resetOrderStore } from '@/infrastructure/repositories/order';
import { cartRepository, resetCartStore } from '@/infrastructure/repositories/cart';
import {
  createOrder,
  getOrderById,
  updateOrderStatus,
  NotFoundError,
  EmptyCartError,
  InvalidStatusTransitionError,
  type OrdersContext,
} from '@/domains/orders/api';
import type { Session } from '@/foundation/auth/session';

// ─────────────────────────────────────────────────────────────────
// Phase 2: リポジトリ統合テスト (T004)
// ─────────────────────────────────────────────────────────────────

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440099';
const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440088';

const createTestOrderData = (overrides = {}) => ({
  userId: TEST_USER_ID,
  items: [
    {
      productId: '550e8400-e29b-41d4-a716-446655440001',
      productName: 'テスト商品A',
      price: 1000,
      quantity: 2,
    },
  ],
  totalAmount: 2000,
  status: 'pending' as const,
  ...overrides,
});

describe('OrderRepository: create', () => {
  beforeEach(() => {
    resetOrderStore();
  });

  it('注文を作成し、UUID・日時が自動生成されること', async () => {
    const order = await orderRepository.create(createTestOrderData());
    expect(order.id).toBeDefined();
    expect(order.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(order.userId).toBe(TEST_USER_ID);
    expect(order.items).toHaveLength(1);
    expect(order.totalAmount).toBe(2000);
    expect(order.status).toBe('pending');
    expect(order.createdAt).toBeInstanceOf(Date);
    expect(order.updatedAt).toBeInstanceOf(Date);
  });
});

describe('OrderRepository: findById', () => {
  beforeEach(() => {
    resetOrderStore();
  });

  it('存在する注文を取得できること', async () => {
    const created = await orderRepository.create(createTestOrderData());
    const found = await orderRepository.findById(created.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.userId).toBe(TEST_USER_ID);
  });

  it('存在しない注文で null を返すこと', async () => {
    const found = await orderRepository.findById('550e8400-e29b-41d4-a716-446655440000');
    expect(found).toBeNull();
  });
});

describe('OrderRepository: findAll', () => {
  beforeEach(() => {
    resetOrderStore();
  });

  it('全注文を取得できること', async () => {
    await orderRepository.create(createTestOrderData());
    await orderRepository.create(createTestOrderData({ totalAmount: 3000 }));
    const orders = await orderRepository.findAll({ offset: 0, limit: 20 });
    expect(orders).toHaveLength(2);
  });

  it('userId でフィルタリングできること', async () => {
    await orderRepository.create(createTestOrderData());
    await orderRepository.create(createTestOrderData({ userId: OTHER_USER_ID }));
    const orders = await orderRepository.findAll({ userId: TEST_USER_ID, offset: 0, limit: 20 });
    expect(orders).toHaveLength(1);
    expect(orders[0].userId).toBe(TEST_USER_ID);
  });

  it('status でフィルタリングできること', async () => {
    await orderRepository.create(createTestOrderData({ status: 'pending' }));
    await orderRepository.create(createTestOrderData({ status: 'confirmed' }));
    const orders = await orderRepository.findAll({ status: 'pending', offset: 0, limit: 20 });
    expect(orders).toHaveLength(1);
    expect(orders[0].status).toBe('pending');
  });

  it('offset と limit でページネーションできること', async () => {
    for (let i = 0; i < 5; i++) {
      await orderRepository.create(createTestOrderData({ totalAmount: i * 1000 }));
    }
    const page1 = await orderRepository.findAll({ offset: 0, limit: 2 });
    const page2 = await orderRepository.findAll({ offset: 2, limit: 2 });
    expect(page1).toHaveLength(2);
    expect(page2).toHaveLength(2);
  });

  it('新しい注文が先に来ること（降順）', async () => {
    const order1 = await orderRepository.create(createTestOrderData({ totalAmount: 1000 }));
    // 少し遅延させて時間差を作る
    await new Promise((r) => setTimeout(r, 10));
    const order2 = await orderRepository.create(createTestOrderData({ totalAmount: 2000 }));
    const orders = await orderRepository.findAll({ offset: 0, limit: 20 });
    expect(orders[0].id).toBe(order2.id);
    expect(orders[1].id).toBe(order1.id);
  });
});

describe('OrderRepository: updateStatus', () => {
  beforeEach(() => {
    resetOrderStore();
  });

  it('ステータスを更新できること', async () => {
    const created = await orderRepository.create(createTestOrderData());
    const updated = await orderRepository.updateStatus(created.id, 'confirmed');
    expect(updated.status).toBe('confirmed');
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
  });

  it('存在しない注文の更新でエラーになること', async () => {
    await expect(
      orderRepository.updateStatus('550e8400-e29b-41d4-a716-446655440000', 'confirmed')
    ).rejects.toThrow();
  });
});

describe('OrderRepository: count', () => {
  beforeEach(() => {
    resetOrderStore();
  });

  it('全注文件数を取得できること', async () => {
    await orderRepository.create(createTestOrderData());
    await orderRepository.create(createTestOrderData());
    const count = await orderRepository.count({});
    expect(count).toBe(2);
  });

  it('userId でフィルタした件数を取得できること', async () => {
    await orderRepository.create(createTestOrderData());
    await orderRepository.create(createTestOrderData({ userId: OTHER_USER_ID }));
    const count = await orderRepository.count({ userId: TEST_USER_ID });
    expect(count).toBe(1);
  });

  it('status でフィルタした件数を取得できること', async () => {
    await orderRepository.create(createTestOrderData({ status: 'pending' }));
    await orderRepository.create(createTestOrderData({ status: 'confirmed' }));
    const count = await orderRepository.count({ status: 'pending' });
    expect(count).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 3: US1 - createOrder ユースケース統合テスト (T009)
// ─────────────────────────────────────────────────────────────────

const BUYER_USER_ID = '550e8400-e29b-41d4-a716-446655440100';
const PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440001';

function createBuyerSession(userId = BUYER_USER_ID): Session {
  return {
    userId,
    role: 'buyer',
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function createBuyerContext(userId = BUYER_USER_ID): OrdersContext {
  return {
    session: createBuyerSession(userId),
    repository: orderRepository,
    cartFetcher,
  };
}

describe('ユースケース統合: createOrder', () => {
  beforeEach(() => {
    resetOrderStore();
    resetCartStore();
  });

  it('カートから注文を作成し、Order オブジェクトが返却されること', async () => {
    // カートに商品を追加
    await cartRepository.addItem(BUYER_USER_ID, {
      productId: PRODUCT_ID,
      productName: 'テスト商品A',
      price: 1500,
      quantity: 2,
    });

    const context = createBuyerContext();
    const result = await createOrder({ confirmed: true }, context);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.userId).toBe(BUYER_USER_ID);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productName).toBe('テスト商品A');
    expect(result.items[0].price).toBe(1500);
    expect(result.items[0].quantity).toBe(2);
    expect(result.totalAmount).toBe(3000);
    expect(result.status).toBe('pending');
  });

  it('注文作成後にカートがクリアされること', async () => {
    await cartRepository.addItem(BUYER_USER_ID, {
      productId: PRODUCT_ID,
      productName: 'テスト商品A',
      price: 1000,
      quantity: 1,
    });

    const context = createBuyerContext();
    await createOrder({ confirmed: true }, context);

    const cart = await cartRepository.findByUserId(BUYER_USER_ID);
    expect(cart === null || cart.items.length === 0).toBe(true);
  });

  it('カートが空の場合 EmptyCartError になること', async () => {
    // 空カートを作成
    await cartRepository.create(BUYER_USER_ID);

    const context = createBuyerContext();
    await expect(createOrder({ confirmed: true }, context)).rejects.toThrow(EmptyCartError);
  });

  it('作成した注文を getOrderById で取得できること', async () => {
    await cartRepository.addItem(BUYER_USER_ID, {
      productId: PRODUCT_ID,
      productName: 'テスト商品A',
      price: 1000,
      quantity: 1,
    });

    const context = createBuyerContext();
    const created = await createOrder({ confirmed: true }, context);
    const found = await getOrderById({ id: created.id }, context);

    expect(found.id).toBe(created.id);
    expect(found.totalAmount).toBe(1000);
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 6: US4 - updateOrderStatus 統合テスト (T031)
// ─────────────────────────────────────────────────────────────────

const ADMIN_USER_ID = '550e8400-e29b-41d4-a716-446655440200';

function createAdminSession(): Session {
  return {
    userId: ADMIN_USER_ID,
    role: 'admin',
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function createAdminContext(): OrdersContext {
  return {
    session: createAdminSession(),
    repository: orderRepository,
    cartFetcher,
  };
}

describe('ユースケース統合: updateOrderStatus', () => {
  beforeEach(() => {
    resetOrderStore();
    resetCartStore();
  });

  it('注文のステータスを pending → confirmed に更新できること', async () => {
    // 注文を作成
    await cartRepository.addItem(BUYER_USER_ID, {
      productId: PRODUCT_ID,
      productName: 'テスト商品A',
      price: 1000,
      quantity: 1,
    });
    const buyerContext = createBuyerContext();
    const order = await createOrder({ confirmed: true }, buyerContext);

    // 管理者がステータスを更新
    const adminContext = createAdminContext();
    const updated = await updateOrderStatus({ id: order.id, status: 'confirmed' }, adminContext);

    expect(updated.status).toBe('confirmed');
  });

  it('無効な遷移で InvalidStatusTransitionError になること', async () => {
    await cartRepository.addItem(BUYER_USER_ID, {
      productId: PRODUCT_ID,
      productName: 'テスト商品A',
      price: 1000,
      quantity: 1,
    });
    const buyerContext = createBuyerContext();
    const order = await createOrder({ confirmed: true }, buyerContext);

    const adminContext = createAdminContext();
    // pending → shipped は無効
    await expect(
      updateOrderStatus({ id: order.id, status: 'shipped' }, adminContext)
    ).rejects.toThrow(InvalidStatusTransitionError);
  });

  it('存在しない注文で NotFoundError になること', async () => {
    const adminContext = createAdminContext();
    await expect(
      updateOrderStatus({ id: '550e8400-e29b-41d4-a716-446655440999', status: 'confirmed' }, adminContext)
    ).rejects.toThrow(NotFoundError);
  });
});
