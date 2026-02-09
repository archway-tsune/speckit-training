/**
 * Orders ドメイン - 統合テスト
 * 実際のリポジトリを使ったユースケースの入出力スキーマ適合テスト
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import type { OrderRepository, CartFetcher } from '@/contracts/orders';
import type { Cart, CartItem } from '@/contracts/cart';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  NotFoundError,
  InvalidStatusTransitionError,
} from '@/domains/orders/api';
import {
  GetOrdersOutputSchema,
  GetOrderByIdOutputSchema,
  CreateOrderOutputSchema,
  UpdateOrderStatusOutputSchema,
} from '@/contracts/orders';
import { ValidationError } from '@/foundation/validation/runtime';

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

const BUYER_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_USER_ID = '660e8400-e29b-41d4-a716-446655440099';
const ADMIN_USER_ID = 'aa0e8400-e29b-41d4-a716-446655440010';

function createBuyerSession(userId = BUYER_USER_ID): Session {
  return { userId, role: 'buyer', expiresAt: new Date(Date.now() + 3600000) };
}

function createAdminSession(): Session {
  return { userId: ADMIN_USER_ID, role: 'admin', expiresAt: new Date(Date.now() + 3600000) };
}

// インメモリリポジトリ
function createInMemoryRepository(): OrderRepository & { _store: Map<string, import('@/contracts/orders').Order> } {
  const store = new Map<string, import('@/contracts/orders').Order>();
  return {
    _store: store,
    async findAll(params) {
      let items = Array.from(store.values());
      if (params.userId) items = items.filter((o) => o.userId === params.userId);
      if (params.status) items = items.filter((o) => o.status === params.status);
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return items.slice(params.offset, params.offset + params.limit);
    },
    async findById(id) {
      return store.get(id) || null;
    },
    async create(data) {
      const now = new Date();
      const order = {
        id: crypto.randomUUID(),
        userId: data.userId,
        items: data.items,
        totalAmount: data.totalAmount,
        status: data.status,
        createdAt: now,
        updatedAt: now,
      } as import('@/contracts/orders').Order;
      store.set(order.id, order);
      return order;
    },
    async updateStatus(id, status) {
      const order = store.get(id)!;
      order.status = status;
      order.updatedAt = new Date();
      store.set(id, order);
      return order;
    },
    async count(params) {
      let items = Array.from(store.values());
      if (params.userId) items = items.filter((o) => o.userId === params.userId);
      if (params.status) items = items.filter((o) => o.status === params.status);
      return items.length;
    },
  };
}

function createInMemoryCartFetcher(): CartFetcher & { _carts: Map<string, Cart> } {
  const carts = new Map<string, Cart>();
  return {
    _carts: carts,
    async getByUserId(userId) {
      return carts.get(userId) || null;
    },
    async clear(userId) {
      carts.delete(userId);
    },
  };
}

function createTestCart(userId: string, items: CartItem[]): Cart {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    id: crypto.randomUUID(),
    userId,
    items,
    subtotal,
    itemCount,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const SAMPLE_CART_ITEMS: CartItem[] = [
  {
    productId: '880e8400-e29b-41d4-a716-446655440002',
    productName: 'テスト商品A',
    price: 1000,
    imageUrl: 'https://example.com/a.jpg',
    quantity: 2,
    addedAt: new Date(),
  },
  {
    productId: '880e8400-e29b-41d4-a716-446655440003',
    productName: 'テスト商品B',
    price: 2000,
    imageUrl: 'https://example.com/b.jpg',
    quantity: 1,
    addedAt: new Date(),
  },
];

// ─────────────────────────────────────────────────────────────────
// 統合テスト: 出力スキーマ適合
// ─────────────────────────────────────────────────────────────────

describe('Orders 統合テスト', () => {
  let repository: ReturnType<typeof createInMemoryRepository>;
  let cartFetcher: ReturnType<typeof createInMemoryCartFetcher>;

  beforeEach(() => {
    repository = createInMemoryRepository();
    cartFetcher = createInMemoryCartFetcher();
  });

  describe('getOrders - 出力スキーマ適合', () => {
    it('空の注文一覧がGetOrdersOutputSchemaに適合する', async () => {
      const result = await getOrders({}, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });

      expect(() => GetOrdersOutputSchema.parse(result)).not.toThrow();
      expect(result.orders).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('注文がある場合の出力がGetOrdersOutputSchemaに適合する', async () => {
      // 注文を作成
      const cart = createTestCart(BUYER_USER_ID, SAMPLE_CART_ITEMS);
      cartFetcher._carts.set(BUYER_USER_ID, cart);
      await createOrder({ confirmed: true }, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });

      // 再度カートを作成して別の注文を作成
      const cart2 = createTestCart(BUYER_USER_ID, SAMPLE_CART_ITEMS);
      cartFetcher._carts.set(BUYER_USER_ID, cart2);
      await createOrder({ confirmed: true }, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });

      const result = await getOrders({}, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });

      expect(() => GetOrdersOutputSchema.parse(result)).not.toThrow();
      expect(result.orders).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe('getOrderById - 出力スキーマ適合', () => {
    it('注文詳細がGetOrderByIdOutputSchemaに適合する', async () => {
      const cart = createTestCart(BUYER_USER_ID, SAMPLE_CART_ITEMS);
      cartFetcher._carts.set(BUYER_USER_ID, cart);
      const order = await createOrder({ confirmed: true }, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });

      const result = await getOrderById({ id: order.id }, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });

      expect(() => GetOrderByIdOutputSchema.parse(result)).not.toThrow();
      expect(result.items).toHaveLength(2);
      expect(result.totalAmount).toBe(4000); // 1000*2 + 2000*1
    });
  });

  describe('createOrder - 出力スキーマ適合', () => {
    it('作成された注文がCreateOrderOutputSchemaに適合する', async () => {
      const cart = createTestCart(BUYER_USER_ID, SAMPLE_CART_ITEMS);
      cartFetcher._carts.set(BUYER_USER_ID, cart);

      const result = await createOrder({ confirmed: true }, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });

      expect(() => CreateOrderOutputSchema.parse(result)).not.toThrow();
      expect(result.status).toBe('pending');
      expect(result.userId).toBe(BUYER_USER_ID);
      expect(result.items).toHaveLength(2);
      // imageUrl と addedAt は OrderItem に含まれない
      expect(result.items[0]).not.toHaveProperty('imageUrl');
      expect(result.items[0]).not.toHaveProperty('addedAt');
    });

    it('注文作成後にカートがクリアされる', async () => {
      const cart = createTestCart(BUYER_USER_ID, SAMPLE_CART_ITEMS);
      cartFetcher._carts.set(BUYER_USER_ID, cart);

      await createOrder({ confirmed: true }, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });

      const remainingCart = await cartFetcher.getByUserId(BUYER_USER_ID);
      expect(remainingCart).toBeNull();
    });
  });

  describe('updateOrderStatus - 出力スキーマ適合', () => {
    it('ステータス更新結果がUpdateOrderStatusOutputSchemaに適合する', async () => {
      const cart = createTestCart(BUYER_USER_ID, SAMPLE_CART_ITEMS);
      cartFetcher._carts.set(BUYER_USER_ID, cart);
      const order = await createOrder({ confirmed: true }, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });

      const result = await updateOrderStatus({ id: order.id, status: 'confirmed' }, {
        session: createAdminSession(),
        repository,
        cartFetcher,
      });

      expect(() => UpdateOrderStatusOutputSchema.parse(result)).not.toThrow();
      expect(result.status).toBe('confirmed');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // バリデーションエラー
  // ─────────────────────────────────────────────────────────────────

  describe('バリデーションエラー', () => {
    it('getOrders: 不正なpage値でValidationErrorがスローされる', async () => {
      await expect(
        getOrders({ page: -1 }, {
          session: createBuyerSession(),
          repository,
          cartFetcher,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('createOrder: confirmed=false でValidationErrorがスローされる', async () => {
      await expect(
        createOrder({ confirmed: false }, {
          session: createBuyerSession(),
          repository,
          cartFetcher,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('updateOrderStatus: 不正なUUIDでValidationErrorがスローされる', async () => {
      await expect(
        updateOrderStatus({ id: 'invalid-id', status: 'confirmed' }, {
          session: createAdminSession(),
          repository,
          cartFetcher,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // ステータス遷移の正常系・異常系
  // ─────────────────────────────────────────────────────────────────

  describe('ステータス遷移ルール', () => {
    async function createTestOrder() {
      const cart = createTestCart(BUYER_USER_ID, SAMPLE_CART_ITEMS);
      cartFetcher._carts.set(BUYER_USER_ID, cart);
      return createOrder({ confirmed: true }, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });
    }

    it('pending → confirmed → shipped → delivered の正常遷移', async () => {
      const order = await createTestOrder();
      const ctx = { session: createAdminSession(), repository, cartFetcher };

      const r1 = await updateOrderStatus({ id: order.id, status: 'confirmed' }, ctx);
      expect(r1.status).toBe('confirmed');

      const r2 = await updateOrderStatus({ id: order.id, status: 'shipped' }, ctx);
      expect(r2.status).toBe('shipped');

      const r3 = await updateOrderStatus({ id: order.id, status: 'delivered' }, ctx);
      expect(r3.status).toBe('delivered');
    });

    it('pending → cancelled のキャンセル遷移', async () => {
      const order = await createTestOrder();
      const ctx = { session: createAdminSession(), repository, cartFetcher };

      const result = await updateOrderStatus({ id: order.id, status: 'cancelled' }, ctx);
      expect(result.status).toBe('cancelled');
    });

    it('confirmed → cancelled のキャンセル遷移', async () => {
      const order = await createTestOrder();
      const ctx = { session: createAdminSession(), repository, cartFetcher };

      await updateOrderStatus({ id: order.id, status: 'confirmed' }, ctx);
      const result = await updateOrderStatus({ id: order.id, status: 'cancelled' }, ctx);
      expect(result.status).toBe('cancelled');
    });

    it('delivered からの遷移は不可', async () => {
      const order = await createTestOrder();
      const ctx = { session: createAdminSession(), repository, cartFetcher };

      await updateOrderStatus({ id: order.id, status: 'confirmed' }, ctx);
      await updateOrderStatus({ id: order.id, status: 'shipped' }, ctx);
      await updateOrderStatus({ id: order.id, status: 'delivered' }, ctx);

      await expect(
        updateOrderStatus({ id: order.id, status: 'pending' }, ctx)
      ).rejects.toThrow(InvalidStatusTransitionError);
    });

    it('cancelled からの遷移は不可', async () => {
      const order = await createTestOrder();
      const ctx = { session: createAdminSession(), repository, cartFetcher };

      await updateOrderStatus({ id: order.id, status: 'cancelled' }, ctx);

      await expect(
        updateOrderStatus({ id: order.id, status: 'pending' }, ctx)
      ).rejects.toThrow(InvalidStatusTransitionError);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // エンドツーエンドシナリオ
  // ─────────────────────────────────────────────────────────────────

  describe('E2E シナリオ: 注文作成→取得→ステータス更新', () => {
    it('購入者が注文を作成し、管理者がステータスを更新する', async () => {
      // 1. 購入者がカートに商品を入れて注文作成
      const cart = createTestCart(BUYER_USER_ID, SAMPLE_CART_ITEMS);
      cartFetcher._carts.set(BUYER_USER_ID, cart);

      const order = await createOrder({ confirmed: true }, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });
      expect(order.status).toBe('pending');

      // 2. 購入者が注文一覧で確認
      const buyerOrders = await getOrders({}, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });
      expect(buyerOrders.orders).toHaveLength(1);
      expect(buyerOrders.orders[0].id).toBe(order.id);

      // 3. 購入者が注文詳細で確認
      const orderDetail = await getOrderById({ id: order.id }, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });
      expect(orderDetail.totalAmount).toBe(4000);

      // 4. 管理者がステータスを更新
      const adminCtx = { session: createAdminSession(), repository, cartFetcher };
      await updateOrderStatus({ id: order.id, status: 'confirmed' }, adminCtx);
      await updateOrderStatus({ id: order.id, status: 'shipped' }, adminCtx);
      await updateOrderStatus({ id: order.id, status: 'delivered' }, adminCtx);

      // 5. 最終確認
      const finalOrder = await getOrderById({ id: order.id }, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });
      expect(finalOrder.status).toBe('delivered');
    });

    it('他人の注文にはアクセスできない', async () => {
      // 購入者Aが注文作成
      const cart = createTestCart(BUYER_USER_ID, SAMPLE_CART_ITEMS);
      cartFetcher._carts.set(BUYER_USER_ID, cart);
      const order = await createOrder({ confirmed: true }, {
        session: createBuyerSession(),
        repository,
        cartFetcher,
      });

      // 購入者Bがアクセスしようとする → NotFoundError
      await expect(
        getOrderById({ id: order.id }, {
          session: createBuyerSession(OTHER_USER_ID),
          repository,
          cartFetcher,
        })
      ).rejects.toThrow(NotFoundError);

      // 購入者Bの一覧には表示されない
      const otherOrders = await getOrders({}, {
        session: createBuyerSession(OTHER_USER_ID),
        repository,
        cartFetcher,
      });
      expect(otherOrders.orders).toHaveLength(0);
    });
  });
});
