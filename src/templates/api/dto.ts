/**
 * DTO定義テンプレート
 * 入出力契約の標準パターンを提供
 */
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────
// 共通スキーマ
// ─────────────────────────────────────────────────────────────────

/**
 * UUID スキーマ
 */
export const UuidSchema = z.string().uuid();

/**
 * 日付スキーマ（文字列から Date に変換）
 */
export const DateSchema = z.coerce.date();

/**
 * ページネーション入力スキーマ
 */
export const PaginationInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationInput = z.infer<typeof PaginationInputSchema>;

/**
 * ページネーション出力スキーマ
 */
export const PaginationOutputSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type PaginationOutput = z.infer<typeof PaginationOutputSchema>;

// ─────────────────────────────────────────────────────────────────
// DTO定義ヘルパー
// ─────────────────────────────────────────────────────────────────

/**
 * エンティティの基本フィールド
 */
export const BaseEntitySchema = z.object({
  id: UuidSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema,
});
export type BaseEntity = z.infer<typeof BaseEntitySchema>;

/**
 * リスト出力を生成するヘルパー
 */
export function createListOutputSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    pagination: PaginationOutputSchema,
  });
}

/**
 * 成功レスポンスを生成するヘルパー
 */
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
});
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

// ─────────────────────────────────────────────────────────────────
// サンプルDTO定義（テンプレートとして利用）
// ─────────────────────────────────────────────────────────────────

/**
 * サンプルエンティティ
 */
export const SampleEntitySchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(200),
  value: z.number().int().min(0),
  status: z.enum(['active', 'inactive']),
});
export type SampleEntity = z.infer<typeof SampleEntitySchema>;

/**
 * サンプル作成入力
 */
export const CreateSampleInputSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(200, '名前は200文字以内で入力してください'),
  value: z.number().int().min(0, '値は0以上で入力してください'),
  status: z.enum(['active', 'inactive']).default('active'),
});
export type CreateSampleInput = z.infer<typeof CreateSampleInputSchema>;

/**
 * サンプル更新入力
 */
export const UpdateSampleInputSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200).optional(),
  value: z.number().int().min(0).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
export type UpdateSampleInput = z.infer<typeof UpdateSampleInputSchema>;

/**
 * サンプル削除入力
 */
export const DeleteSampleInputSchema = z.object({
  id: UuidSchema,
});
export type DeleteSampleInput = z.infer<typeof DeleteSampleInputSchema>;

/**
 * サンプル一覧入力
 */
export const GetSampleListInputSchema = PaginationInputSchema.extend({
  status: z.enum(['active', 'inactive']).optional(),
});
export type GetSampleListInput = z.infer<typeof GetSampleListInputSchema>;

/**
 * サンプル一覧出力
 */
export const GetSampleListOutputSchema = createListOutputSchema(SampleEntitySchema);
export type GetSampleListOutput = z.infer<typeof GetSampleListOutputSchema>;
