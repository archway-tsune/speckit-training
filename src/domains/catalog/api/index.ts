/**
 * Catalog ドメイン - API 本番実装
 * 商品関連のビジネスロジック
 */
import type { Session } from '@/foundation/auth/session';
import { validate } from '@/foundation/validation/runtime';
import {
  GetProductsInputSchema,
  GetProductByIdInputSchema,
  type GetProductsOutput,
  type GetProductByIdOutput,
  type ProductRepository,
} from '@/contracts/catalog';

// ─────────────────────────────────────────────────────────────────
// コンテキスト
// ─────────────────────────────────────────────────────────────────

export interface CatalogContext {
  session: Session;
  repository: ProductRepository;
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

// ─────────────────────────────────────────────────────────────────
// 商品一覧取得
// ─────────────────────────────────────────────────────────────────

export async function getProducts(
  rawInput: unknown,
  context: CatalogContext
): Promise<GetProductsOutput> {
  const input = validate(GetProductsInputSchema, rawInput);

  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  // 購入者は published 商品のみ取得可能
  const status = context.session.role === 'buyer' ? 'published' : (input.status || undefined);
  const keyword = input.keyword || undefined;

  const offset = (page - 1) * limit;

  const [products, total] = await Promise.all([
    context.repository.findAll({ status, offset, limit, keyword }),
    context.repository.count(status, keyword),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// 商品詳細取得
// ─────────────────────────────────────────────────────────────────

export async function getProductById(
  rawInput: unknown,
  context: CatalogContext
): Promise<GetProductByIdOutput> {
  const input = validate(GetProductByIdInputSchema, rawInput);

  const product = await context.repository.findById(input.id);

  if (!product) {
    throw new NotFoundError('商品が見つかりません');
  }

  // 購入者は published 商品のみ閲覧可能
  if (context.session.role === 'buyer' && product.status !== 'published') {
    throw new NotFoundError('商品が見つかりません');
  }

  return product;
}
