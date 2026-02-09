/**
 * 認証・認可 契約定義
 * ECサイト向けアーキテクチャ基盤 - 認証関連DTO
 */

import { z } from 'zod';

/**
 * ロール定義
 */
export const RoleSchema = z.enum(['buyer', 'admin']);
export type Role = z.infer<typeof RoleSchema>;

/**
 * セッションデータ（最小限の情報のみ保持）
 */
export const SessionDataSchema = z.object({
  userId: z.string().uuid(),
  role: RoleSchema,
});
export type SessionData = z.infer<typeof SessionDataSchema>;

/**
 * ログイン入力
 */
export const LoginInputSchema = z.object({
  /** メールアドレス */
  email: z.string().email('有効なメールアドレスを入力してください'),
  /** パスワード */
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

/**
 * ログイン出力
 */
export const LoginOutputSchema = z.object({
  /** ユーザーID */
  userId: z.string().uuid(),
  /** ロール */
  role: RoleSchema,
});
export type LoginOutput = z.infer<typeof LoginOutputSchema>;

/**
 * 認可チェック用メタデータ
 */
export interface AuthorizeMetadata {
  /** 必要なロール */
  requiredRole: Role | Role[];
  /** 操作説明（監査ログ用） */
  action: string;
}

/**
 * ユースケースごとの認可要件
 */
export const UseCaseAuthorization = {
  // Catalog
  getProducts: { requiredRole: ['buyer', 'admin'], action: '商品一覧取得' },
  getProductById: { requiredRole: ['buyer', 'admin'], action: '商品詳細取得' },
  createProduct: { requiredRole: 'admin', action: '商品登録' },
  updateProduct: { requiredRole: 'admin', action: '商品更新' },
  deleteProduct: { requiredRole: 'admin', action: '商品削除' },

  // Cart
  getCart: { requiredRole: 'buyer', action: 'カート取得' },
  addToCart: { requiredRole: 'buyer', action: 'カート追加' },
  updateCartItem: { requiredRole: 'buyer', action: 'カート更新' },
  removeFromCart: { requiredRole: 'buyer', action: 'カート削除' },

  // Orders
  getOrders: { requiredRole: ['buyer', 'admin'], action: '注文一覧取得' },
  getOrderById: { requiredRole: ['buyer', 'admin'], action: '注文詳細取得' },
  createOrder: { requiredRole: 'buyer', action: '注文作成' },
  updateOrderStatus: { requiredRole: 'admin', action: '注文ステータス更新' },
} as const satisfies Record<string, AuthorizeMetadata>;
