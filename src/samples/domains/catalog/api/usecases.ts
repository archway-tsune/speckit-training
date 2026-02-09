/**
 * Catalog ドメイン - ユースケース
 * 商品関連のビジネスロジック
 */
import type { Session } from '@/foundation/auth/session';
import { authorize, AuthorizationError } from '@/foundation/auth/authorize';
import { validate, ValidationError } from '@/foundation/validation/runtime';
import {
  GetProductsInputSchema,
  GetProductByIdInputSchema,
  CreateProductInputSchema,
  UpdateProductInputSchema,
  DeleteProductInputSchema,
  type Product,
  type GetProductsInput,
  type GetProductsOutput,
  type GetProductByIdInput,
  type GetProductByIdOutput,
  type CreateProductInput,
  type CreateProductOutput,
  type UpdateProductInput,
  type UpdateProductOutput,
  type DeleteProductInput,
  type DeleteProductOutput,
  type ProductRepository,
} from '@/contracts/catalog';

// 既存の外部参照を維持するための再エクスポート
export type { ProductRepository } from '@/contracts/catalog';

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

  // デフォルト値が適用された後の値を取得
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;

  // buyerはpublished商品のみ取得可能
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
      totalPages: Math.ceil(total / limit),
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

  // buyerはpublished商品のみ閲覧可能
  if (context.session.role === 'buyer' && product.status !== 'published') {
    throw new NotFoundError('商品が見つかりません');
  }

  return product;
}

// ─────────────────────────────────────────────────────────────────
// 商品登録
// ─────────────────────────────────────────────────────────────────

export async function createProduct(
  rawInput: unknown,
  context: CatalogContext
): Promise<CreateProductOutput> {
  authorize(context.session, 'admin');

  const input = validate(CreateProductInputSchema, rawInput);

  const product = await context.repository.create({
    name: input.name,
    price: input.price,
    stock: input.stock,
    description: input.description,
    imageUrl: input.imageUrl,
    status: input.status || 'draft',
  });

  return product;
}

// ─────────────────────────────────────────────────────────────────
// 商品更新
// ─────────────────────────────────────────────────────────────────

export async function updateProduct(
  rawInput: unknown,
  context: CatalogContext
): Promise<UpdateProductOutput> {
  authorize(context.session, 'admin');

  const input = validate(UpdateProductInputSchema, rawInput);

  const existing = await context.repository.findById(input.id);
  if (!existing) {
    throw new NotFoundError('商品が見つかりません');
  }

  const product = await context.repository.update(input.id, {
    name: input.name,
    price: input.price,
    stock: input.stock,
    description: input.description,
    imageUrl: input.imageUrl,
    status: input.status,
  });

  return product;
}

// ─────────────────────────────────────────────────────────────────
// 商品削除
// ─────────────────────────────────────────────────────────────────

export async function deleteProduct(
  rawInput: unknown,
  context: CatalogContext
): Promise<DeleteProductOutput> {
  authorize(context.session, 'admin');

  const input = validate(DeleteProductInputSchema, rawInput);

  const existing = await context.repository.findById(input.id);
  if (!existing) {
    throw new NotFoundError('商品が見つかりません');
  }

  await context.repository.delete(input.id);

  return { success: true };
}
