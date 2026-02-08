/**
 * 注文ドメイン — ユースケース単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi } from 'vitest';
import {
  ValidStatusTransitions,
  type OrderStatus,
  type Order,
  type OrderRepository,
  type CartFetcher,
} from '@/contracts/orders';
import type { Cart, CartItem } from '@/contracts/cart';
import type { Session } from '@/foundation/auth/session';
import {
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
  NotFoundError,
  EmptyCartError,
  InvalidStatusTransitionError,
  type OrdersContext,
} from '@/domains/orders/api';

// ─────────────────────────────────────────────────────────────────
// Phase 2: ステートマシンヘルパーテスト (T003)
// ─────────────────────────────────────────────────────────────────

// インポート先はこれから作成する
import {
  getValidTransitions,
  canTransitionTo,
  isTerminalStatus,
} from '@/domains/orders/types';

describe('ステートマシンヘルパー: getValidTransitions', () => {
  it('pending から confirmed, cancelled に遷移可能なこと', () => {
    const transitions = getValidTransitions('pending');
    expect(transitions).toEqual(['confirmed', 'cancelled']);
  });

  it('confirmed から shipped, cancelled に遷移可能なこと', () => {
    const transitions = getValidTransitions('confirmed');
    expect(transitions).toEqual(['shipped', 'cancelled']);
  });

  it('shipped から delivered のみに遷移可能なこと', () => {
    const transitions = getValidTransitions('shipped');
    expect(transitions).toEqual(['delivered']);
  });

  it('delivered から遷移先がないこと', () => {
    const transitions = getValidTransitions('delivered');
    expect(transitions).toEqual([]);
  });

  it('cancelled から遷移先がないこと', () => {
    const transitions = getValidTransitions('cancelled');
    expect(transitions).toEqual([]);
  });
});

describe('ステートマシンヘルパー: canTransitionTo', () => {
  it('pending → confirmed は有効な遷移', () => {
    expect(canTransitionTo('pending', 'confirmed')).toBe(true);
  });

  it('pending → cancelled は有効な遷移', () => {
    expect(canTransitionTo('pending', 'cancelled')).toBe(true);
  });

  it('confirmed → shipped は有効な遷移', () => {
    expect(canTransitionTo('confirmed', 'shipped')).toBe(true);
  });

  it('confirmed → cancelled は有効な遷移', () => {
    expect(canTransitionTo('confirmed', 'cancelled')).toBe(true);
  });

  it('shipped → delivered は有効な遷移', () => {
    expect(canTransitionTo('shipped', 'delivered')).toBe(true);
  });

  it('pending → shipped は無効な遷移', () => {
    expect(canTransitionTo('pending', 'shipped')).toBe(false);
  });

  it('shipped → cancelled は無効な遷移', () => {
    expect(canTransitionTo('shipped', 'cancelled')).toBe(false);
  });

  it('delivered → confirmed は無効な遷移', () => {
    expect(canTransitionTo('delivered', 'confirmed')).toBe(false);
  });

  it('cancelled → pending は無効な遷移', () => {
    expect(canTransitionTo('cancelled', 'pending')).toBe(false);
  });
});

describe('ステートマシンヘルパー: isTerminalStatus', () => {
  it('delivered は最終状態であること', () => {
    expect(isTerminalStatus('delivered')).toBe(true);
  });

  it('cancelled は最終状態であること', () => {
    expect(isTerminalStatus('cancelled')).toBe(true);
  });

  it('pending は最終状態でないこと', () => {
    expect(isTerminalStatus('pending')).toBe(false);
  });

  it('confirmed は最終状態でないこと', () => {
    expect(isTerminalStatus('confirmed')).toBe(false);
  });

  it('shipped は最終状態でないこと', () => {
    expect(isTerminalStatus('shipped')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// ヘルパー関数
// ─────────────────────────────────────────────────────────────────

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440100';
const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440200';
const TEST_ORDER_ID = '550e8400-e29b-41d4-a716-446655440300';
const PRODUCT_ID_1 = '550e8400-e29b-41d4-a716-446655440001';

function createMockSession(role: 'buyer' | 'admin' = 'buyer', userId = TEST_USER_ID): Session {
  return {
    userId,
    role,
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function createMockCart(userId: string, items: CartItem[] = []): Cart {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    id: '550e8400-e29b-41d4-a716-446655440400',
    userId,
    items,
    subtotal,
    itemCount,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createMockCartItem(): CartItem {
  return {
    productId: PRODUCT_ID_1,
    productName: 'テスト商品A',
    price: 1000,
    imageUrl: 'https://example.com/image.jpg',
    quantity: 2,
    addedAt: new Date(),
  };
}

function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: TEST_ORDER_ID,
    userId: TEST_USER_ID,
    items: [
      {
        productId: PRODUCT_ID_1,
        productName: 'テスト商品A',
        price: 1000,
        quantity: 2,
      },
    ],
    totalAmount: 2000,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockRepository(): OrderRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(async (data) => ({
      id: TEST_ORDER_ID,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    updateStatus: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  };
}

function createMockCartFetcher(cart: Cart | null = null): CartFetcher {
  return {
    getByUserId: vi.fn().mockResolvedValue(cart),
    clear: vi.fn().mockResolvedValue(undefined),
  };
}

function createContext(
  overrides: Partial<OrdersContext> = {}
): OrdersContext {
  return {
    session: createMockSession(),
    repository: createMockRepository(),
    cartFetcher: createMockCartFetcher(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────
// Phase 3: US1 - createOrder ユースケース単体テスト (T007)
// ─────────────────────────────────────────────────────────────────

describe('ユースケース: createOrder', () => {
  it('カートから注文を正常に作成できること', async () => {
    const cartItem = createMockCartItem();
    const cart = createMockCart(TEST_USER_ID, [cartItem]);
    const repo = createMockRepository();
    const cartFetcher = createMockCartFetcher(cart);
    const context = createContext({ repository: repo, cartFetcher });

    const result = await createOrder({ confirmed: true }, context);

    expect(result).toBeDefined();
    expect(result.id).toBe(TEST_ORDER_ID);
    expect(result.userId).toBe(TEST_USER_ID);
    expect(result.status).toBe('pending');
    expect(result.totalAmount).toBe(cart.subtotal);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productId).toBe(PRODUCT_ID_1);
    expect(result.items[0].productName).toBe('テスト商品A');
    expect(result.items[0].price).toBe(1000);
    expect(result.items[0].quantity).toBe(2);
  });

  it('注文作成時に totalAmount にカートの subtotal が使用されること', async () => {
    const cartItem = createMockCartItem();
    const cart = createMockCart(TEST_USER_ID, [cartItem]);
    const repo = createMockRepository();
    const cartFetcher = createMockCartFetcher(cart);
    const context = createContext({ repository: repo, cartFetcher });

    await createOrder({ confirmed: true }, context);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        totalAmount: cart.subtotal,
        status: 'pending',
      })
    );
  });

  it('注文作成後にカートがクリアされること', async () => {
    const cart = createMockCart(TEST_USER_ID, [createMockCartItem()]);
    const cartFetcher = createMockCartFetcher(cart);
    const context = createContext({ cartFetcher });

    await createOrder({ confirmed: true }, context);

    expect(cartFetcher.clear).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it('カートが空の場合 EmptyCartError がスローされること', async () => {
    const cart = createMockCart(TEST_USER_ID, []);
    const cartFetcher = createMockCartFetcher(cart);
    const context = createContext({ cartFetcher });

    await expect(createOrder({ confirmed: true }, context)).rejects.toThrow(EmptyCartError);
  });

  it('カートが存在しない場合 EmptyCartError がスローされること', async () => {
    const cartFetcher = createMockCartFetcher(null);
    const context = createContext({ cartFetcher });

    await expect(createOrder({ confirmed: true }, context)).rejects.toThrow(EmptyCartError);
  });

  it('buyer ロールでないとエラーになること', async () => {
    const context = createContext({
      session: createMockSession('admin'),
    });

    await expect(createOrder({ confirmed: true }, context)).rejects.toThrow();
  });

  it('confirmed が true でない場合バリデーションエラーになること', async () => {
    const context = createContext();

    await expect(createOrder({ confirmed: false }, context)).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 3: US1 - getOrderById ユースケース単体テスト (T008)
// ─────────────────────────────────────────────────────────────────

describe('ユースケース: getOrderById', () => {
  it('自分の注文を取得できること', async () => {
    const order = createMockOrder();
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(order);
    const context = createContext({ repository: repo });

    const result = await getOrderById({ id: TEST_ORDER_ID }, context);

    expect(result).toBeDefined();
    expect(result.id).toBe(TEST_ORDER_ID);
    expect(result.userId).toBe(TEST_USER_ID);
  });

  it('存在しない注文で NotFoundError がスローされること', async () => {
    const context = createContext();

    await expect(
      getOrderById({ id: TEST_ORDER_ID }, context)
    ).rejects.toThrow(NotFoundError);
  });

  it('購入者が他人の注文にアクセスすると NotFoundError がスローされること', async () => {
    const order = createMockOrder({ userId: OTHER_USER_ID });
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(order);
    const context = createContext({ repository: repo });

    await expect(
      getOrderById({ id: TEST_ORDER_ID }, context)
    ).rejects.toThrow(NotFoundError);
  });

  it('管理者は他人の注文にもアクセスできること', async () => {
    const order = createMockOrder({ userId: OTHER_USER_ID });
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(order);
    const context = createContext({
      session: createMockSession('admin'),
      repository: repo,
    });

    const result = await getOrderById({ id: TEST_ORDER_ID }, context);
    expect(result.id).toBe(TEST_ORDER_ID);
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 4: US2 - getOrders ユースケース単体テスト (T015)
// ─────────────────────────────────────────────────────────────────

describe('ユースケース: getOrders', () => {
  it('buyer は自分の注文のみ取得されること', async () => {
    const orders = [createMockOrder(), createMockOrder({ id: '550e8400-e29b-41d4-a716-446655440301' })];
    const repo = createMockRepository();
    (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(orders);
    (repo.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    const context = createContext({ repository: repo });

    const result = await getOrders({}, context);

    expect(result.orders).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    // buyer の場合、userId が自動フィルタされること
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ userId: TEST_USER_ID })
    );
  });

  it('ページネーションが正しく動作すること', async () => {
    const repo = createMockRepository();
    (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([createMockOrder()]);
    (repo.count as ReturnType<typeof vi.fn>).mockResolvedValue(25);
    const context = createContext({ repository: repo });

    const result = await getOrders({ page: 2, limit: 10 }, context);

    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.total).toBe(25);
    expect(result.pagination.totalPages).toBe(3);
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 10, limit: 10 })
    );
  });

  it('注文0件で空配列が返却されること', async () => {
    const repo = createMockRepository();
    (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (repo.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    const context = createContext({ repository: repo });

    const result = await getOrders({}, context);

    expect(result.orders).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });

  it('デフォルト値が適用されること（page=1, limit=20）', async () => {
    const repo = createMockRepository();
    (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (repo.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    const context = createContext({ repository: repo });

    await getOrders({}, context);

    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0, limit: 20 })
    );
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 5: US3 - getOrders 管理者向け単体テスト (T025)
// ─────────────────────────────────────────────────────────────────

describe('ユースケース: getOrders（管理者）', () => {
  it('admin は全注文を取得できること（userId フィルタなし）', async () => {
    const orders = [
      createMockOrder(),
      createMockOrder({ id: '550e8400-e29b-41d4-a716-446655440301', userId: OTHER_USER_ID }),
    ];
    const repo = createMockRepository();
    (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(orders);
    (repo.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    const context = createContext({
      session: createMockSession('admin'),
      repository: repo,
    });

    const result = await getOrders({}, context);

    expect(result.orders).toHaveLength(2);
    // admin の場合、userId フィルタが適用されないこと
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ userId: undefined })
    );
  });

  it('admin がステータスフィルタを使用できること', async () => {
    const repo = createMockRepository();
    (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (repo.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    const context = createContext({
      session: createMockSession('admin'),
      repository: repo,
    });

    await getOrders({ status: 'pending' }, context);

    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' })
    );
  });

  it('admin が userId フィルタを使用できること', async () => {
    const repo = createMockRepository();
    (repo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (repo.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    const context = createContext({
      session: createMockSession('admin'),
      repository: repo,
    });

    await getOrders({ userId: OTHER_USER_ID }, context);

    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ userId: OTHER_USER_ID })
    );
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 6: US4 - updateOrderStatus ユースケース単体テスト (T030)
// ─────────────────────────────────────────────────────────────────

describe('ユースケース: updateOrderStatus', () => {
  it('pending → confirmed のステータス更新が成功すること', async () => {
    const order = createMockOrder({ status: 'pending' });
    const updatedOrder = createMockOrder({ status: 'confirmed' });
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(order);
    (repo.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue(updatedOrder);
    const context = createContext({
      session: createMockSession('admin'),
      repository: repo,
    });

    const result = await updateOrderStatus({ id: TEST_ORDER_ID, status: 'confirmed' }, context);

    expect(result.status).toBe('confirmed');
    expect(repo.updateStatus).toHaveBeenCalledWith(TEST_ORDER_ID, 'confirmed');
  });

  it('pending → cancelled のステータス更新が成功すること', async () => {
    const order = createMockOrder({ status: 'pending' });
    const updatedOrder = createMockOrder({ status: 'cancelled' });
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(order);
    (repo.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue(updatedOrder);
    const context = createContext({
      session: createMockSession('admin'),
      repository: repo,
    });

    const result = await updateOrderStatus({ id: TEST_ORDER_ID, status: 'cancelled' }, context);
    expect(result.status).toBe('cancelled');
  });

  it('confirmed → shipped のステータス更新が成功すること', async () => {
    const order = createMockOrder({ status: 'confirmed' });
    const updatedOrder = createMockOrder({ status: 'shipped' });
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(order);
    (repo.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue(updatedOrder);
    const context = createContext({
      session: createMockSession('admin'),
      repository: repo,
    });

    const result = await updateOrderStatus({ id: TEST_ORDER_ID, status: 'shipped' }, context);
    expect(result.status).toBe('shipped');
  });

  it('confirmed → cancelled のステータス更新が成功すること', async () => {
    const order = createMockOrder({ status: 'confirmed' });
    const updatedOrder = createMockOrder({ status: 'cancelled' });
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(order);
    (repo.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue(updatedOrder);
    const context = createContext({
      session: createMockSession('admin'),
      repository: repo,
    });

    const result = await updateOrderStatus({ id: TEST_ORDER_ID, status: 'cancelled' }, context);
    expect(result.status).toBe('cancelled');
  });

  it('shipped → delivered のステータス更新が成功すること', async () => {
    const order = createMockOrder({ status: 'shipped' });
    const updatedOrder = createMockOrder({ status: 'delivered' });
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(order);
    (repo.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue(updatedOrder);
    const context = createContext({
      session: createMockSession('admin'),
      repository: repo,
    });

    const result = await updateOrderStatus({ id: TEST_ORDER_ID, status: 'delivered' }, context);
    expect(result.status).toBe('delivered');
  });

  it('shipped → cancelled は無効な遷移で InvalidStatusTransitionError がスローされること', async () => {
    const order = createMockOrder({ status: 'shipped' });
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(order);
    const context = createContext({
      session: createMockSession('admin'),
      repository: repo,
    });

    await expect(
      updateOrderStatus({ id: TEST_ORDER_ID, status: 'cancelled' }, context)
    ).rejects.toThrow(InvalidStatusTransitionError);
  });

  it('delivered → confirmed は無効な遷移で InvalidStatusTransitionError がスローされること', async () => {
    const order = createMockOrder({ status: 'delivered' });
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(order);
    const context = createContext({
      session: createMockSession('admin'),
      repository: repo,
    });

    await expect(
      updateOrderStatus({ id: TEST_ORDER_ID, status: 'confirmed' }, context)
    ).rejects.toThrow(InvalidStatusTransitionError);
  });

  it('cancelled → pending は無効な遷移で InvalidStatusTransitionError がスローされること', async () => {
    const order = createMockOrder({ status: 'cancelled' });
    const repo = createMockRepository();
    (repo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(order);
    const context = createContext({
      session: createMockSession('admin'),
      repository: repo,
    });

    await expect(
      updateOrderStatus({ id: TEST_ORDER_ID, status: 'pending' }, context)
    ).rejects.toThrow(InvalidStatusTransitionError);
  });

  it('存在しない注文で NotFoundError がスローされること', async () => {
    const repo = createMockRepository();
    const context = createContext({
      session: createMockSession('admin'),
      repository: repo,
    });

    await expect(
      updateOrderStatus({ id: TEST_ORDER_ID, status: 'confirmed' }, context)
    ).rejects.toThrow(NotFoundError);
  });

  it('admin ロールでないとエラーになること', async () => {
    const context = createContext({
      session: createMockSession('buyer'),
    });

    await expect(
      updateOrderStatus({ id: TEST_ORDER_ID, status: 'confirmed' }, context)
    ).rejects.toThrow();
  });
});
