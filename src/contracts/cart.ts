/**
 * Cart ドメイン契約定義
 * ECサイト向けアーキテクチャ基盤 - カート関連DTO
 */

import { z } from 'zod';

/**
 * カート内商品
 */
export const CartItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  price: z.number().int().min(0),
  imageUrl: z.string().url().optional(),
  quantity: z.number().int().min(1),
  addedAt: z.coerce.date(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

/**
 * カートエンティティ
 */
export const CartSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  items: z.array(CartItemSchema),
  /** 小計 */
  subtotal: z.number().int().min(0),
  /** 商品数（items の quantity 合計） */
  itemCount: z.number().int().min(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Cart = z.infer<typeof CartSchema>;

// ─────────────────────────────────────────────────────────────────
// カート取得 (GET /api/cart) - buyer のみ
// ─────────────────────────────────────────────────────────────────

/**
 * カート取得 - 入力（なし、セッションからユーザー特定）
 */
export const GetCartInputSchema = z.object({});
export type GetCartInput = z.infer<typeof GetCartInputSchema>;

/**
 * カート取得 - 出力
 */
export const GetCartOutputSchema = CartSchema;
export type GetCartOutput = z.infer<typeof GetCartOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// カート追加 (POST /api/cart/items) - buyer のみ
// ─────────────────────────────────────────────────────────────────

/**
 * カート追加 - 入力
 */
export const AddToCartInputSchema = z.object({
  productId: z.string().uuid('有効な商品IDを指定してください'),
  quantity: z.number().int().min(1, '数量は1以上で指定してください').default(1),
});
export type AddToCartInput = z.infer<typeof AddToCartInputSchema>;

/**
 * カート追加 - 出力
 */
export const AddToCartOutputSchema = CartSchema;
export type AddToCartOutput = z.infer<typeof AddToCartOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// カート更新 (PUT /api/cart/items/:productId) - buyer のみ
// ─────────────────────────────────────────────────────────────────

/**
 * カート更新 - 入力
 */
export const UpdateCartItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1, '数量は1以上で指定してください'),
});
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemInputSchema>;

/**
 * カート更新 - 出力
 */
export const UpdateCartItemOutputSchema = CartSchema;
export type UpdateCartItemOutput = z.infer<typeof UpdateCartItemOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// カート削除 (DELETE /api/cart/items/:productId) - buyer のみ
// ─────────────────────────────────────────────────────────────────

/**
 * カート削除 - 入力
 */
export const RemoveFromCartInputSchema = z.object({
  productId: z.string().uuid(),
});
export type RemoveFromCartInput = z.infer<typeof RemoveFromCartInputSchema>;

/**
 * カート削除 - 出力
 */
export const RemoveFromCartOutputSchema = CartSchema;
export type RemoveFromCartOutput = z.infer<typeof RemoveFromCartOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// リポジトリインターフェース
// ─────────────────────────────────────────────────────────────────

export interface CartRepository {
  findByUserId(userId: string): Promise<Cart | null>;
  create(userId: string): Promise<Cart>;
  addItem(
    userId: string,
    item: Omit<CartItem, 'addedAt'>
  ): Promise<Cart>;
  updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<Cart>;
  removeItem(userId: string, productId: string): Promise<Cart>;
}

export interface ProductFetcher {
  findById(productId: string): Promise<{
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    stock: number;
  } | null>;
}
