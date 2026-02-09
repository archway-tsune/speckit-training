/**
 * Orders ドメイン - ユースケース
 * 注文関連のビジネスロジック
 */
import type { Session } from '@/foundation/auth/session';
import { authorize, AuthorizationError } from '@/foundation/auth/authorize';
import { validate, ValidationError } from '@/foundation/validation/runtime';
import {
  GetOrdersInputSchema,
  GetOrderByIdInputSchema,
  CreateOrderInputSchema,
  UpdateOrderStatusInputSchema,
  ValidStatusTransitions,
  type Order,
  type OrderItem,
  type OrderStatus,
  type GetOrdersOutput,
  type GetOrderByIdOutput,
  type CreateOrderOutput,
  type UpdateOrderStatusOutput,
  type OrderRepository,
  type CartFetcher,
} from '@/contracts/orders';

// 既存の外部参照を維持するための再エクスポート
export type { OrderRepository, CartFetcher } from '@/contracts/orders';

// ─────────────────────────────────────────────────────────────────
// コンテキスト
// ─────────────────────────────────────────────────────────────────

export interface OrdersContext {
  session: Session;
  repository: OrderRepository;
  cartFetcher: CartFetcher;
}

// ─────────────────────────────────────────────────────────────────
// エラー
// ─────────────────────────────────────────────────────────────────

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class EmptyCartError extends Error {
  constructor() {
    super('カートが空です');
    this.name = 'EmptyCartError';
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(currentStatus: OrderStatus, targetStatus: OrderStatus) {
    super(`ステータスを ${currentStatus} から ${targetStatus} に変更できません`);
    this.name = 'InvalidStatusTransitionError';
  }
}

// ─────────────────────────────────────────────────────────────────
// 注文一覧取得
// ─────────────────────────────────────────────────────────────────

export async function getOrders(
  rawInput: unknown,
  context: OrdersContext
): Promise<GetOrdersOutput> {
  const input = validate(GetOrdersInputSchema, rawInput);

  // デフォルト値が適用された後の値を取得
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  // buyerは自分の注文のみ、adminは全注文を取得可能
  const userId = context.session.role === 'buyer' ? context.session.userId : input.userId;

  const offset = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    context.repository.findAll({
      userId,
      status: input.status,
      offset,
      limit,
    }),
    context.repository.count({ userId, status: input.status }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// 注文詳細取得
// ─────────────────────────────────────────────────────────────────

export async function getOrderById(
  rawInput: unknown,
  context: OrdersContext
): Promise<GetOrderByIdOutput> {
  const input = validate(GetOrderByIdInputSchema, rawInput);

  const order = await context.repository.findById(input.id);

  if (!order) {
    throw new NotFoundError('注文が見つかりません');
  }

  // buyerは自分の注文のみ閲覧可能
  if (context.session.role === 'buyer' && order.userId !== context.session.userId) {
    throw new NotFoundError('注文が見つかりません');
  }

  return order;
}

// ─────────────────────────────────────────────────────────────────
// 注文作成
// ─────────────────────────────────────────────────────────────────

export async function createOrder(
  rawInput: unknown,
  context: OrdersContext
): Promise<CreateOrderOutput> {
  authorize(context.session, 'buyer');

  validate(CreateOrderInputSchema, rawInput);

  // カート取得
  const cart = await context.cartFetcher.getByUserId(context.session.userId);

  if (!cart || cart.items.length === 0) {
    throw new EmptyCartError();
  }

  // 注文作成
  const orderItems: OrderItem[] = cart.items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    price: item.price,
    quantity: item.quantity,
  }));

  const order = await context.repository.create({
    userId: context.session.userId,
    items: orderItems,
    totalAmount: cart.subtotal,
    status: 'pending',
  });

  // カートをクリア
  await context.cartFetcher.clear(context.session.userId);

  return order;
}

// ─────────────────────────────────────────────────────────────────
// 注文ステータス更新
// ─────────────────────────────────────────────────────────────────

export async function updateOrderStatus(
  rawInput: unknown,
  context: OrdersContext
): Promise<UpdateOrderStatusOutput> {
  authorize(context.session, 'admin');

  const input = validate(UpdateOrderStatusInputSchema, rawInput);

  const order = await context.repository.findById(input.id);

  if (!order) {
    throw new NotFoundError('注文が見つかりません');
  }

  // ステータス遷移の検証
  const validTransitions = ValidStatusTransitions[order.status];
  if (!validTransitions.includes(input.status)) {
    throw new InvalidStatusTransitionError(order.status, input.status);
  }

  const updatedOrder = await context.repository.updateStatus(input.id, input.status);

  return updatedOrder;
}
