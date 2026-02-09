/**
 * Orders ドメイン - ユースケース単体テスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import { AuthorizationError } from '@/foundation/auth/authorize';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  NotFoundError,
  EmptyCartError,
  InvalidStatusTransitionError,
  type OrderRepository,
  type CartFetcher,
} from '@/samples/domains/orders/api/usecases';
import type { Order } from '@/contracts/orders';
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

function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    items: [
      {
        productId: '550e8400-e29b-41d4-a716-446655440002',
        productName: 'テスト商品',
        price: 1000,
        quantity: 1,
      },
    ],
    totalAmount: 1000,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: '550e8400-e29b-41d4-a716-446655440003',
    userId: '550e8400-e29b-41d4-a716-446655440000',
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockRepository(): OrderRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    count: vi.fn(),
  };
}

function createMockCartFetcher(): CartFetcher {
  return {
    getByUserId: vi.fn(),
    clear: vi.fn(),
  };
}

// ─────────────────────────────────────────────────────────────────
// 注文一覧取得
// ─────────────────────────────────────────────────────────────────

describe('getOrders', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;

  beforeEach(() => {
    repository = createMockRepository();
    cartFetcher = createMockCartFetcher();
  });

  describe('Given: buyerユーザー', () => {
    describe('When: 注文一覧を取得する', () => {
      it('Then: 自分の注文のみを取得する', async () => {
        const orders = [createMockOrder()];
        vi.mocked(repository.findAll).mockResolvedValue(orders);
        vi.mocked(repository.count).mockResolvedValue(1);

        const result = await getOrders(
          { page: 1, limit: 20 },
          { session: createMockSession('buyer'), repository, cartFetcher }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ userId: '550e8400-e29b-41d4-a716-446655440000' })
        );
        expect(result.orders).toHaveLength(1);
      });
    });
  });

  describe('Given: adminユーザー', () => {
    describe('When: 注文一覧を取得する', () => {
      it('Then: 全注文を取得できる', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        await getOrders(
          { page: 1, limit: 20 },
          { session: createMockSession('admin'), repository, cartFetcher }
        );

        expect(repository.findAll).toHaveBeenCalledWith(
          expect.objectContaining({ userId: undefined })
        );
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 注文詳細取得
// ─────────────────────────────────────────────────────────────────

describe('getOrderById', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;

  beforeEach(() => {
    repository = createMockRepository();
    cartFetcher = createMockCartFetcher();
  });

  describe('Given: 存在する注文', () => {
    describe('When: 詳細を取得する', () => {
      it('Then: 注文情報を返す', async () => {
        const order = createMockOrder();
        vi.mocked(repository.findById).mockResolvedValue(order);

        const result = await getOrderById(
          { id: order.id },
          { session: createMockSession('buyer'), repository, cartFetcher }
        );

        expect(result.id).toBe(order.id);
      });
    });
  });

  describe('Given: 他ユーザーの注文', () => {
    describe('When: buyerが詳細を取得しようとする', () => {
      it('Then: NotFoundErrorをスローする', async () => {
        const order = createMockOrder({
          userId: '550e8400-e29b-41d4-a716-446655440099', // 別ユーザー
        });
        vi.mocked(repository.findById).mockResolvedValue(order);

        await expect(
          getOrderById(
            { id: order.id },
            { session: createMockSession('buyer'), repository, cartFetcher }
          )
        ).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('Given: 存在しない注文', () => {
    describe('When: 詳細を取得しようとする', () => {
      it('Then: NotFoundErrorをスローする', async () => {
        vi.mocked(repository.findById).mockResolvedValue(null);

        await expect(
          getOrderById(
            { id: '550e8400-e29b-41d4-a716-446655440999' },
            { session: createMockSession('buyer'), repository, cartFetcher }
          )
        ).rejects.toThrow(NotFoundError);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 注文作成
// ─────────────────────────────────────────────────────────────────

describe('createOrder', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;

  beforeEach(() => {
    repository = createMockRepository();
    cartFetcher = createMockCartFetcher();
  });

  describe('Given: buyerユーザーとカート内商品', () => {
    describe('When: 注文を作成する', () => {
      it('Then: 注文を作成してカートをクリアする', async () => {
        const cart = createMockCart();
        const order = createMockOrder();
        vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
        vi.mocked(repository.create).mockResolvedValue(order);
        vi.mocked(cartFetcher.clear).mockResolvedValue();

        const result = await createOrder(
          { confirmed: true },
          { session: createMockSession('buyer'), repository, cartFetcher }
        );

        expect(result.id).toBe(order.id);
        expect(cartFetcher.clear).toHaveBeenCalled();
      });
    });
  });

  describe('Given: 空のカート', () => {
    describe('When: 注文を作成しようとする', () => {
      it('Then: EmptyCartErrorをスローする', async () => {
        vi.mocked(cartFetcher.getByUserId).mockResolvedValue(
          createMockCart({ items: [], subtotal: 0, itemCount: 0 })
        );

        await expect(
          createOrder(
            { confirmed: true },
            { session: createMockSession('buyer'), repository, cartFetcher }
          )
        ).rejects.toThrow(EmptyCartError);
      });
    });
  });

  describe('Given: adminユーザー', () => {
    describe('When: 注文を作成する', () => {
      it('Then: adminもbuyer権限を持つため注文を作成できる', async () => {
        const cart = createMockCart();
        const order = createMockOrder();
        vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
        vi.mocked(repository.create).mockResolvedValue(order);
        vi.mocked(cartFetcher.clear).mockResolvedValue();

        const result = await createOrder(
          { confirmed: true },
          { session: createMockSession('admin'), repository, cartFetcher }
        );

        expect(result.id).toBe(order.id);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 注文ステータス更新
// ─────────────────────────────────────────────────────────────────

describe('updateOrderStatus', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;

  beforeEach(() => {
    repository = createMockRepository();
    cartFetcher = createMockCartFetcher();
  });

  describe('Given: adminユーザーとpending注文', () => {
    describe('When: confirmedに更新する', () => {
      it('Then: ステータスを更新する', async () => {
        const order = createMockOrder({ status: 'pending' });
        const updatedOrder = createMockOrder({ status: 'confirmed' });
        vi.mocked(repository.findById).mockResolvedValue(order);
        vi.mocked(repository.updateStatus).mockResolvedValue(updatedOrder);

        const result = await updateOrderStatus(
          { id: order.id, status: 'confirmed' },
          { session: createMockSession('admin'), repository, cartFetcher }
        );

        expect(result.status).toBe('confirmed');
      });
    });

    describe('When: 無効なステータスに更新しようとする', () => {
      it('Then: InvalidStatusTransitionErrorをスローする', async () => {
        const order = createMockOrder({ status: 'pending' });
        vi.mocked(repository.findById).mockResolvedValue(order);

        await expect(
          updateOrderStatus(
            { id: order.id, status: 'delivered' }, // pending -> delivered は無効
            { session: createMockSession('admin'), repository, cartFetcher }
          )
        ).rejects.toThrow(InvalidStatusTransitionError);
      });
    });
  });

  describe('Given: buyerユーザー', () => {
    describe('When: ステータスを更新しようとする', () => {
      it('Then: AuthorizationErrorをスローする', async () => {
        await expect(
          updateOrderStatus(
            { id: '550e8400-e29b-41d4-a716-446655440001', status: 'confirmed' },
            { session: createMockSession('buyer'), repository, cartFetcher }
          )
        ).rejects.toThrow(AuthorizationError);
      });
    });
  });
});
