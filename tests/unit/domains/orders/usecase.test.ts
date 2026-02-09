/**
 * Orders ドメイン - ユースケース単体テスト
 * TDD Red フェーズ: テストを先に書き、失敗を確認してから実装に着手する
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import type { Order, OrderRepository, CartFetcher } from '@/contracts/orders';
import type { Cart } from '@/contracts/cart';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  NotFoundError,
  EmptyCartError,
  InvalidStatusTransitionError,
} from '@/domains/orders/api';

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

const BUYER_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_USER_ID = '660e8400-e29b-41d4-a716-446655440099';

function createMockSession(role: 'buyer' | 'admin' = 'buyer', userId = BUYER_USER_ID): Session {
  return {
    userId,
    role,
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: '770e8400-e29b-41d4-a716-446655440001',
    userId: BUYER_USER_ID,
    items: [
      {
        productId: '880e8400-e29b-41d4-a716-446655440002',
        productName: 'テスト商品A',
        price: 1000,
        quantity: 2,
      },
    ],
    totalAmount: 2000,
    status: 'pending',
    createdAt: new Date('2026-02-09T00:00:00Z'),
    updatedAt: new Date('2026-02-09T00:00:00Z'),
    ...overrides,
  };
}

function createMockCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: '990e8400-e29b-41d4-a716-446655440003',
    userId: BUYER_USER_ID,
    items: [
      {
        productId: '880e8400-e29b-41d4-a716-446655440002',
        productName: 'テスト商品A',
        price: 1000,
        imageUrl: 'https://example.com/image.jpg',
        quantity: 2,
        addedAt: new Date(),
      },
    ],
    subtotal: 2000,
    itemCount: 2,
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
// getOrders ユースケース
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
      it('Then: 自分の注文のみ返される', async () => {
        const orders = [createMockOrder()];
        vi.mocked(repository.findAll).mockResolvedValue(orders);
        vi.mocked(repository.count).mockResolvedValue(1);

        const result = await getOrders({}, {
          session: createMockSession('buyer'),
          repository,
          cartFetcher,
        });

        expect(result.orders).toHaveLength(1);
        expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
          expect.objectContaining({ userId: BUYER_USER_ID })
        );
      });

      it('Then: デフォルトのページネーション（page=1, limit=20）が適用される', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        const result = await getOrders({}, {
          session: createMockSession('buyer'),
          repository,
          cartFetcher,
        });

        expect(result.pagination).toEqual({
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        });
        expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 0, limit: 20 })
        );
      });
    });

    describe('When: ページ指定で注文一覧を取得する', () => {
      it('Then: 指定されたページのデータが返される', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(50);

        const result = await getOrders({ page: 3, limit: 10 }, {
          session: createMockSession('buyer'),
          repository,
          cartFetcher,
        });

        expect(result.pagination).toEqual({
          page: 3,
          limit: 10,
          total: 50,
          totalPages: 5,
        });
        expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 20, limit: 10 })
        );
      });
    });
  });

  describe('Given: adminユーザー', () => {
    describe('When: 注文一覧を取得する', () => {
      it('Then: 全ユーザーの注文が返される（userIdフィルタなし）', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        await getOrders({}, {
          session: createMockSession('admin'),
          repository,
          cartFetcher,
        });

        expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
          expect.objectContaining({ userId: undefined })
        );
      });
    });

    describe('When: ステータスで絞り込む', () => {
      it('Then: 指定ステータスの注文のみ返される', async () => {
        vi.mocked(repository.findAll).mockResolvedValue([]);
        vi.mocked(repository.count).mockResolvedValue(0);

        await getOrders({ status: 'pending' }, {
          session: createMockSession('admin'),
          repository,
          cartFetcher,
        });

        expect(vi.mocked(repository.findAll)).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'pending' })
        );
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// getOrderById ユースケース
// ─────────────────────────────────────────────────────────────────

describe('getOrderById', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;

  beforeEach(() => {
    repository = createMockRepository();
    cartFetcher = createMockCartFetcher();
  });

  describe('Given: buyerユーザー', () => {
    describe('When: 自分の注文を取得する', () => {
      it('Then: 注文詳細が返される', async () => {
        const order = createMockOrder();
        vi.mocked(repository.findById).mockResolvedValue(order);

        const result = await getOrderById(
          { id: order.id },
          { session: createMockSession('buyer'), repository, cartFetcher }
        );

        expect(result.id).toBe(order.id);
        expect(result.items).toHaveLength(1);
      });
    });

    describe('When: 他人の注文を取得しようとする', () => {
      it('Then: NotFoundErrorがスローされる', async () => {
        const order = createMockOrder({ userId: OTHER_USER_ID });
        vi.mocked(repository.findById).mockResolvedValue(order);

        await expect(
          getOrderById(
            { id: order.id },
            { session: createMockSession('buyer'), repository, cartFetcher }
          )
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('When: 存在しない注文を取得しようとする', () => {
      it('Then: NotFoundErrorがスローされる', async () => {
        vi.mocked(repository.findById).mockResolvedValue(null);

        await expect(
          getOrderById(
            { id: '770e8400-e29b-41d4-a716-446655440099' },
            { session: createMockSession('buyer'), repository, cartFetcher }
          )
        ).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('Given: adminユーザー', () => {
    describe('When: 任意のユーザーの注文を取得する', () => {
      it('Then: 注文詳細が返される', async () => {
        const order = createMockOrder({ userId: OTHER_USER_ID });
        vi.mocked(repository.findById).mockResolvedValue(order);

        const result = await getOrderById(
          { id: order.id },
          { session: createMockSession('admin'), repository, cartFetcher }
        );

        expect(result.id).toBe(order.id);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// createOrder ユースケース
// ─────────────────────────────────────────────────────────────────

describe('createOrder', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;

  beforeEach(() => {
    repository = createMockRepository();
    cartFetcher = createMockCartFetcher();
  });

  describe('Given: buyerユーザーでカートに商品がある', () => {
    describe('When: 注文を作成する', () => {
      it('Then: カートの内容から注文が作成される', async () => {
        const cart = createMockCart();
        const createdOrder = createMockOrder();
        vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
        vi.mocked(repository.create).mockResolvedValue(createdOrder);

        const result = await createOrder(
          { confirmed: true },
          { session: createMockSession('buyer'), repository, cartFetcher }
        );

        expect(result.id).toBe(createdOrder.id);
        expect(vi.mocked(repository.create)).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: BUYER_USER_ID,
            items: [
              {
                productId: '880e8400-e29b-41d4-a716-446655440002',
                productName: 'テスト商品A',
                price: 1000,
                quantity: 2,
              },
            ],
            totalAmount: 2000,
            status: 'pending',
          })
        );
      });

      it('Then: 注文作成後にカートがクリアされる', async () => {
        const cart = createMockCart();
        const createdOrder = createMockOrder();
        vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
        vi.mocked(repository.create).mockResolvedValue(createdOrder);

        await createOrder(
          { confirmed: true },
          { session: createMockSession('buyer'), repository, cartFetcher }
        );

        expect(vi.mocked(cartFetcher.clear)).toHaveBeenCalledWith(BUYER_USER_ID);
      });
    });
  });

  describe('Given: カートが空', () => {
    describe('When: 注文を作成しようとする', () => {
      it('Then: EmptyCartErrorがスローされる（カートなし）', async () => {
        vi.mocked(cartFetcher.getByUserId).mockResolvedValue(null);

        await expect(
          createOrder(
            { confirmed: true },
            { session: createMockSession('buyer'), repository, cartFetcher }
          )
        ).rejects.toThrow(EmptyCartError);
      });

      it('Then: EmptyCartErrorがスローされる（アイテムなし）', async () => {
        const emptyCart = createMockCart({ items: [], subtotal: 0, itemCount: 0 });
        vi.mocked(cartFetcher.getByUserId).mockResolvedValue(emptyCart);

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
    describe('When: 注文を作成しようとする', () => {
      it('Then: ForbiddenErrorがスローされる', async () => {
        await expect(
          createOrder(
            { confirmed: true },
            { session: createMockSession('admin'), repository, cartFetcher }
          )
        ).rejects.toThrow();
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// updateOrderStatus ユースケース
// ─────────────────────────────────────────────────────────────────

describe('updateOrderStatus', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;

  beforeEach(() => {
    repository = createMockRepository();
    cartFetcher = createMockCartFetcher();
  });

  describe('Given: adminユーザー', () => {
    describe('When: pending → confirmed に遷移する', () => {
      it('Then: ステータスが更新される', async () => {
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

    describe('When: pending → cancelled に遷移する', () => {
      it('Then: ステータスが更新される', async () => {
        const order = createMockOrder({ status: 'pending' });
        const updatedOrder = createMockOrder({ status: 'cancelled' });
        vi.mocked(repository.findById).mockResolvedValue(order);
        vi.mocked(repository.updateStatus).mockResolvedValue(updatedOrder);

        const result = await updateOrderStatus(
          { id: order.id, status: 'cancelled' },
          { session: createMockSession('admin'), repository, cartFetcher }
        );

        expect(result.status).toBe('cancelled');
      });
    });

    describe('When: confirmed → shipped に遷移する', () => {
      it('Then: ステータスが更新される', async () => {
        const order = createMockOrder({ status: 'confirmed' });
        const updatedOrder = createMockOrder({ status: 'shipped' });
        vi.mocked(repository.findById).mockResolvedValue(order);
        vi.mocked(repository.updateStatus).mockResolvedValue(updatedOrder);

        const result = await updateOrderStatus(
          { id: order.id, status: 'shipped' },
          { session: createMockSession('admin'), repository, cartFetcher }
        );

        expect(result.status).toBe('shipped');
      });
    });

    describe('When: shipped → delivered に遷移する', () => {
      it('Then: ステータスが更新される', async () => {
        const order = createMockOrder({ status: 'shipped' });
        const updatedOrder = createMockOrder({ status: 'delivered' });
        vi.mocked(repository.findById).mockResolvedValue(order);
        vi.mocked(repository.updateStatus).mockResolvedValue(updatedOrder);

        const result = await updateOrderStatus(
          { id: order.id, status: 'delivered' },
          { session: createMockSession('admin'), repository, cartFetcher }
        );

        expect(result.status).toBe('delivered');
      });
    });

    describe('When: 無効なステータス遷移を試みる', () => {
      it('Then: delivered → confirmed はInvalidStatusTransitionErrorがスローされる', async () => {
        const order = createMockOrder({ status: 'delivered' });
        vi.mocked(repository.findById).mockResolvedValue(order);

        await expect(
          updateOrderStatus(
            { id: order.id, status: 'confirmed' },
            { session: createMockSession('admin'), repository, cartFetcher }
          )
        ).rejects.toThrow(InvalidStatusTransitionError);
      });

      it('Then: cancelled → pending はInvalidStatusTransitionErrorがスローされる', async () => {
        const order = createMockOrder({ status: 'cancelled' });
        vi.mocked(repository.findById).mockResolvedValue(order);

        await expect(
          updateOrderStatus(
            { id: order.id, status: 'pending' },
            { session: createMockSession('admin'), repository, cartFetcher }
          )
        ).rejects.toThrow(InvalidStatusTransitionError);
      });

      it('Then: shipped → confirmed はInvalidStatusTransitionErrorがスローされる', async () => {
        const order = createMockOrder({ status: 'shipped' });
        vi.mocked(repository.findById).mockResolvedValue(order);

        await expect(
          updateOrderStatus(
            { id: order.id, status: 'confirmed' },
            { session: createMockSession('admin'), repository, cartFetcher }
          )
        ).rejects.toThrow(InvalidStatusTransitionError);
      });
    });

    describe('When: 存在しない注文のステータスを更新しようとする', () => {
      it('Then: NotFoundErrorがスローされる', async () => {
        vi.mocked(repository.findById).mockResolvedValue(null);

        await expect(
          updateOrderStatus(
            { id: '770e8400-e29b-41d4-a716-446655440099', status: 'confirmed' },
            { session: createMockSession('admin'), repository, cartFetcher }
          )
        ).rejects.toThrow(NotFoundError);
      });
    });
  });

  describe('Given: buyerユーザー', () => {
    describe('When: ステータスを更新しようとする', () => {
      it('Then: ForbiddenErrorがスローされる', async () => {
        await expect(
          updateOrderStatus(
            { id: '770e8400-e29b-41d4-a716-446655440001', status: 'confirmed' },
            { session: createMockSession('buyer'), repository, cartFetcher }
          )
        ).rejects.toThrow();
      });
    });
  });
});
