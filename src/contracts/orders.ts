/**
 * Orders ドメイン契約定義
 * ECサイト向けアーキテクチャ基盤 - 注文関連DTO
 */

import { z } from 'zod';
import type { Cart } from '@/contracts/cart';

/**
 * 注文ステータス
 */
export const OrderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/**
 * 注文商品
 */
export const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  price: z.number().int().min(0),
  quantity: z.number().int().min(1),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

/**
 * 注文エンティティ
 */
export const OrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  items: z.array(OrderItemSchema).min(1),
  totalAmount: z.number().int().min(0),
  status: OrderStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Order = z.infer<typeof OrderSchema>;

// ─────────────────────────────────────────────────────────────────
// 注文一覧取得 (GET /api/orders)
// buyer: 自分の注文のみ
// admin: 全注文
// ─────────────────────────────────────────────────────────────────

/**
 * 注文一覧取得 - 入力
 */
export const GetOrdersInputSchema = z.object({
  /** ページ番号（1始まり） */
  page: z.coerce.number().int().min(1).default(1),
  /** 1ページあたりの件数 */
  limit: z.coerce.number().int().min(1).max(100).default(20),
  /** ステータスフィルタ */
  status: OrderStatusSchema.optional(),
  /** ユーザーIDフィルタ（admin のみ） */
  userId: z.string().uuid().optional(),
});
export type GetOrdersInput = z.infer<typeof GetOrdersInputSchema>;

/**
 * 注文一覧取得 - 出力
 */
export const GetOrdersOutputSchema = z.object({
  orders: z.array(OrderSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
export type GetOrdersOutput = z.infer<typeof GetOrdersOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// 注文詳細取得 (GET /api/orders/:id)
// buyer: 自分の注文のみ
// admin: 全注文
// ─────────────────────────────────────────────────────────────────

/**
 * 注文詳細取得 - 入力
 */
export const GetOrderByIdInputSchema = z.object({
  id: z.string().uuid(),
});
export type GetOrderByIdInput = z.infer<typeof GetOrderByIdInputSchema>;

/**
 * 注文詳細取得 - 出力
 */
export const GetOrderByIdOutputSchema = OrderSchema;
export type GetOrderByIdOutput = z.infer<typeof GetOrderByIdOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// 注文作成 (POST /api/orders) - buyer のみ
// カートの内容から注文を作成
// ─────────────────────────────────────────────────────────────────

/**
 * 注文作成 - 入力（カートから自動取得のため最小限）
 */
export const CreateOrderInputSchema = z.object({
  /** 注文確認済みフラグ（UI での確認画面を通過した証跡） */
  confirmed: z.literal(true, {
    errorMap: () => ({ message: '注文内容を確認してください' }),
  }),
});
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

/**
 * 注文作成 - 出力
 */
export const CreateOrderOutputSchema = OrderSchema;
export type CreateOrderOutput = z.infer<typeof CreateOrderOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// 注文ステータス更新 (PATCH /api/orders/:id/status) - admin のみ
// ─────────────────────────────────────────────────────────────────

/**
 * 注文ステータス更新 - 入力
 */
export const UpdateOrderStatusInputSchema = z.object({
  id: z.string().uuid(),
  status: OrderStatusSchema,
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusInputSchema>;

/**
 * 注文ステータス更新 - 出力
 */
export const UpdateOrderStatusOutputSchema = OrderSchema;
export type UpdateOrderStatusOutput = z.infer<typeof UpdateOrderStatusOutputSchema>;

/**
 * 有効なステータス遷移
 */
export const ValidStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

// ─────────────────────────────────────────────────────────────────
// リポジトリインターフェース
// ─────────────────────────────────────────────────────────────────

export interface OrderRepository {
  findAll(params: {
    userId?: string;
    status?: OrderStatus;
    offset: number;
    limit: number;
  }): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  create(
    data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  count(params: { userId?: string; status?: OrderStatus }): Promise<number>;
}

export interface CartFetcher {
  getByUserId(userId: string): Promise<Cart | null>;
  clear(userId: string): Promise<void>;
}
