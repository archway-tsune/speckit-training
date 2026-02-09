/**
 * Product ドメイン契約定義
 * 管理者向け商品管理（CRUD + ステータス変更）
 */

import { z } from 'zod';
import { ProductSchema, ProductStatusSchema } from './catalog';

// catalog.ts から共有エンティティ・リポジトリを再エクスポート
export {
  ProductSchema,
  ProductStatusSchema,
  type Product,
  type ProductStatus,
  type ProductRepository,
} from './catalog';

// 商品一覧取得・詳細取得は catalog.ts のスキーマを使用（product ドメインでも同じ形式）
export {
  GetProductsInputSchema,
  GetProductsOutputSchema,
  GetProductByIdInputSchema,
  GetProductByIdOutputSchema,
  type GetProductsInput,
  type GetProductsOutput,
  type GetProductByIdInput,
  type GetProductByIdOutput,
} from './catalog';

// ─────────────────────────────────────────────────────────────────
// 商品登録 (POST /api/products) - admin のみ
// ─────────────────────────────────────────────────────────────────

/**
 * 商品登録 - 入力
 */
export const CreateProductInputSchema = z.object({
  name: z.string().min(1, '商品名を入力してください').max(200, '商品名は200文字以内で入力してください'),
  price: z.number().int().min(0, '価格は0以上で入力してください'),
  stock: z.number().int().min(0, '在庫数は0以上で入力してください').default(0),
  description: z.string().max(2000, '商品説明は2000文字以内で入力してください').optional(),
  imageUrl: z.string().url('有効なURLを入力してください').optional(),
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

/**
 * 商品登録 - 出力
 */
export const CreateProductOutputSchema = ProductSchema;
export type CreateProductOutput = z.infer<typeof CreateProductOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// 商品更新 (PUT /api/products/:id) - admin のみ
// ─────────────────────────────────────────────────────────────────

/**
 * 商品更新 - 入力（部分更新対応）
 */
export const UpdateProductInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, '商品名を入力してください').max(200, '商品名は200文字以内で入力してください').optional(),
  price: z.number().int().min(0, '価格は0以上で入力してください').optional(),
  stock: z.number().int().min(0, '在庫数は0以上で入力してください').optional(),
  description: z.string().max(2000, '商品説明は2000文字以内で入力してください').optional(),
  imageUrl: z.string().url('有効なURLを入力してください').optional(),
  status: ProductStatusSchema.optional(),
});
export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;

/**
 * 商品更新 - 出力
 */
export const UpdateProductOutputSchema = ProductSchema;
export type UpdateProductOutput = z.infer<typeof UpdateProductOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// ステータス変更 (PATCH /api/products/:id/status) - admin のみ
// ─────────────────────────────────────────────────────────────────

/**
 * ステータス変更 - 入力
 */
export const UpdateProductStatusInputSchema = z.object({
  id: z.string().uuid(),
  status: ProductStatusSchema,
});
export type UpdateProductStatusInput = z.infer<typeof UpdateProductStatusInputSchema>;

/**
 * ステータス変更 - 出力
 */
export const UpdateProductStatusOutputSchema = ProductSchema;
export type UpdateProductStatusOutput = z.infer<typeof UpdateProductStatusOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// 商品削除 (DELETE /api/products/:id) - admin のみ
// ─────────────────────────────────────────────────────────────────

/**
 * 商品削除 - 入力
 */
export const DeleteProductInputSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteProductInput = z.infer<typeof DeleteProductInputSchema>;

/**
 * 商品削除 - 出力
 */
export const DeleteProductOutputSchema = z.object({
  success: z.literal(true),
});
export type DeleteProductOutput = z.infer<typeof DeleteProductOutputSchema>;
