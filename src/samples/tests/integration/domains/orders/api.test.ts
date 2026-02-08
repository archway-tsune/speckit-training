/**
 * Orders ドメイン - API統合テスト
 * 契約スキーマとの整合性検証
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Session } from '@/foundation/auth/session';
import {
  GetOrdersInputSchema,
  GetOrdersOutputSchema,
  GetOrderByIdOutputSchema,
  CreateOrderInputSchema,
  CreateOrderOutputSchema,
  UpdateOrderStatusInputSchema,
  ValidStatusTransitions,
  type Order,
} from '@/contracts/orders';
import type { Cart } from '@/contracts/cart';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  type OrderRepository,
  type CartFetcher,
} from '@/samples/domains/orders/api/usecases';

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

function createMockCart(): Cart {
  return {
    id: '550e8400-e29b-41d4-a716-446655440003',
    userId: '550e8400-e29b-41d4-a716-446655440000',
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
// 契約検証テスト
// ─────────────────────────────────────────────────────────────────

describe('Orders API統合テスト', () => {
  let repository: OrderRepository;
  let cartFetcher: CartFetcher;

  beforeEach(() => {
    repository = createMockRepository();
    cartFetcher = createMockCartFetcher();
  });

  describe('getOrders', () => {
    it('入力スキーマに準拠したリクエストを処理できる', async () => {
      const rawInput = { page: '2', limit: '10', status: 'pending' };
      const validatedInput = GetOrdersInputSchema.parse(rawInput);

      vi.mocked(repository.findAll).mockResolvedValue([]);
      vi.mocked(repository.count).mockResolvedValue(0);

      const result = await getOrders(validatedInput, {
        session: createMockSession(),
        repository,
        cartFetcher,
      });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
    });

    it('出力スキーマに準拠したレスポンスを返す', async () => {
      const orders = [createMockOrder()];
      vi.mocked(repository.findAll).mockResolvedValue(orders);
      vi.mocked(repository.count).mockResolvedValue(1);

      const result = await getOrders(
        { page: 1, limit: 20 },
        { session: createMockSession(), repository, cartFetcher }
      );

      const validated = GetOrdersOutputSchema.parse(result);
      expect(validated.orders).toHaveLength(1);
      expect(validated.pagination.total).toBe(1);
    });
  });

  describe('getOrderById', () => {
    it('出力スキーマに準拠した注文を返す', async () => {
      const order = createMockOrder();
      vi.mocked(repository.findById).mockResolvedValue(order);

      const result = await getOrderById(
        { id: order.id },
        { session: createMockSession(), repository, cartFetcher }
      );

      const validated = GetOrderByIdOutputSchema.parse(result);
      expect(validated.id).toBe(order.id);
    });
  });

  describe('createOrder', () => {
    it('入力スキーマのバリデーションメッセージを返す', () => {
      const invalidInput = { confirmed: false };

      const parseResult = CreateOrderInputSchema.safeParse(invalidInput);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        const error = parseResult.error.errors[0];
        expect(error.message).toBe('注文内容を確認してください');
      }
    });

    it('出力スキーマに準拠した注文を返す', async () => {
      const cart = createMockCart();
      const order = createMockOrder({ totalAmount: cart.subtotal });

      vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
      vi.mocked(repository.create).mockResolvedValue(order);
      vi.mocked(cartFetcher.clear).mockResolvedValue();

      const result = await createOrder(
        { confirmed: true },
        { session: createMockSession(), repository, cartFetcher }
      );

      const validated = CreateOrderOutputSchema.parse(result);
      expect(validated.totalAmount).toBe(2000);
    });
  });

  describe('updateOrderStatus', () => {
    it('有効なステータス遷移を許可する', async () => {
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

    it('全ステータス遷移ルールが定義されている', () => {
      const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

      for (const status of statuses) {
        expect(ValidStatusTransitions[status]).toBeDefined();
        expect(Array.isArray(ValidStatusTransitions[status])).toBe(true);
      }
    });
  });

  describe('実際のユースケースシナリオ', () => {
    it('注文作成 → 一覧確認 → 詳細取得 → ステータス更新 の流れが正常に動作する', async () => {
      const cart = createMockCart();
      const order = createMockOrder({ totalAmount: cart.subtotal, status: 'pending' });
      const confirmedOrder = createMockOrder({ totalAmount: cart.subtotal, status: 'confirmed' });

      vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
      vi.mocked(repository.create).mockResolvedValue(order);
      vi.mocked(cartFetcher.clear).mockResolvedValue();
      vi.mocked(repository.findAll).mockResolvedValue([order]);
      vi.mocked(repository.count).mockResolvedValue(1);
      vi.mocked(repository.findById).mockResolvedValue(order);
      vi.mocked(repository.updateStatus).mockResolvedValue(confirmedOrder);

      // 1. 注文作成
      const created = await createOrder(
        { confirmed: true },
        { session: createMockSession(), repository, cartFetcher }
      );
      expect(created.status).toBe('pending');

      // 2. 一覧確認
      const list = await getOrders(
        { page: 1, limit: 20 },
        { session: createMockSession(), repository, cartFetcher }
      );
      expect(list.orders).toHaveLength(1);

      // 3. 詳細取得
      const detail = await getOrderById(
        { id: created.id },
        { session: createMockSession(), repository, cartFetcher }
      );
      expect(detail.id).toBe(created.id);

      // 4. ステータス更新（admin）
      const updated = await updateOrderStatus(
        { id: created.id, status: 'confirmed' },
        { session: createMockSession('admin'), repository, cartFetcher }
      );
      expect(updated.status).toBe('confirmed');
    });

    it('購入者フロー: カート → 注文作成 → 注文確認', async () => {
      const cart = createMockCart();
      const order = createMockOrder({ totalAmount: cart.subtotal });

      vi.mocked(cartFetcher.getByUserId).mockResolvedValue(cart);
      vi.mocked(repository.create).mockResolvedValue(order);
      vi.mocked(cartFetcher.clear).mockResolvedValue();
      vi.mocked(repository.findById).mockResolvedValue(order);

      const buyerSession = createMockSession('buyer');

      // 注文作成
      const created = await createOrder(
        { confirmed: true },
        { session: buyerSession, repository, cartFetcher }
      );

      // カートがクリアされたことを確認
      expect(cartFetcher.clear).toHaveBeenCalledWith(buyerSession.userId);

      // 注文詳細確認
      const detail = await getOrderById(
        { id: created.id },
        { session: buyerSession, repository, cartFetcher }
      );
      expect(detail.items).toHaveLength(1);
      expect(detail.totalAmount).toBe(2000);
    });
  });
});
