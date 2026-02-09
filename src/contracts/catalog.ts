/**
 * Catalog ドメイン契約定義
 * ECサイト向けアーキテクチャ基盤 - 商品関連DTO
 */

import { z } from 'zod';

/**
 * 商品ステータス
 */
export const ProductStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

/**
 * 商品エンティティ
 */
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  price: z.number().int().min(0),
  stock: z.number().int().min(0),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  status: ProductStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Product = z.infer<typeof ProductSchema>;

// ─────────────────────────────────────────────────────────────────
// 商品一覧取得 (GET /api/catalog/products)
// ─────────────────────────────────────────────────────────────────

/**
 * 商品一覧取得 - 入力
 */
export const GetProductsInputSchema = z.object({
  /** ページ番号（1始まり） */
  page: z.coerce.number().int().min(1).default(1),
  /** 1ページあたりの件数 */
  limit: z.coerce.number().int().min(1).max(100).default(20),
  /** ステータスフィルタ（admin のみ draft/archived 指定可） */
  status: ProductStatusSchema.optional(),
  /** 検索キーワード（商品名・説明文の部分一致） */
  keyword: z.string().optional(),
});
export type GetProductsInput = z.infer<typeof GetProductsInputSchema>;

/**
 * 商品一覧取得 - 出力
 */
export const GetProductsOutputSchema = z.object({
  products: z.array(ProductSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
export type GetProductsOutput = z.infer<typeof GetProductsOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// 商品詳細取得 (GET /api/catalog/products/:id)
// ─────────────────────────────────────────────────────────────────

/**
 * 商品詳細取得 - 入力
 */
export const GetProductByIdInputSchema = z.object({
  id: z.string().uuid(),
});
export type GetProductByIdInput = z.infer<typeof GetProductByIdInputSchema>;

/**
 * 商品詳細取得 - 出力
 */
export const GetProductByIdOutputSchema = ProductSchema;
export type GetProductByIdOutput = z.infer<typeof GetProductByIdOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// リポジトリインターフェース
// ─────────────────────────────────────────────────────────────────

export interface ProductRepository {
  findAll(params: {
    status?: Product['status'];
    offset: number;
    limit: number;
    keyword?: string;
  }): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  create(
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Product>;
  update(
    id: string,
    data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Product>;
  delete(id: string): Promise<void>;
  count(status?: Product['status'], keyword?: string): Promise<number>;
}
