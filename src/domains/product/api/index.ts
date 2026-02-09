/**
 * Product ドメイン - API 本番実装
 * 管理者向け商品管理のビジネスロジック
 */
import type { Session } from '@/foundation/auth/session';
import { authorize, ForbiddenError } from '@/foundation/auth/authorize';
import { validate } from '@/foundation/validation/runtime';
import {
  GetProductsInputSchema,
  GetProductByIdInputSchema,
  CreateProductInputSchema,
  UpdateProductInputSchema,
  UpdateProductStatusInputSchema,
  DeleteProductInputSchema,
  type GetProductsOutput,
  type GetProductByIdOutput,
  type CreateProductOutput,
  type UpdateProductOutput,
  type UpdateProductStatusOutput,
  type DeleteProductOutput,
  type ProductRepository,
} from '@/contracts/product';

// ─────────────────────────────────────────────────────────────────
// コンテキスト
// ─────────────────────────────────────────────────────────────────

export interface ProductContext {
  session: Session;
  repository: ProductRepository;
}

// ─────────────────────────────────────────────────────────────────
// エラー
// ─────────────────────────────────────────────────────────────────

export class NotFoundError extends Error {
  constructor(message = '商品が見つかりません') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export { ForbiddenError };

// ─────────────────────────────────────────────────────────────────
// 商品一覧取得（管理者用）
// ─────────────────────────────────────────────────────────────────

export async function getProducts(
  rawInput: unknown,
  context: ProductContext
): Promise<GetProductsOutput> {
  authorize(context.session, 'admin');

  const input = validate(GetProductsInputSchema, rawInput);

  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const status = input.status || undefined;
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
// 商品詳細取得（管理者用）
// ─────────────────────────────────────────────────────────────────

export async function getProductById(
  rawInput: unknown,
  context: ProductContext
): Promise<GetProductByIdOutput> {
  authorize(context.session, 'admin');

  const input = validate(GetProductByIdInputSchema, rawInput);

  const product = await context.repository.findById(input.id);

  if (!product) {
    throw new NotFoundError('商品が見つかりません');
  }

  return product;
}

// ─────────────────────────────────────────────────────────────────
// 商品登録
// ─────────────────────────────────────────────────────────────────

export async function createProduct(
  rawInput: unknown,
  context: ProductContext
): Promise<CreateProductOutput> {
  authorize(context.session, 'admin');

  const input = validate(CreateProductInputSchema, rawInput);

  const product = await context.repository.create({
    name: input.name,
    price: input.price,
    stock: input.stock ?? 0,
    description: input.description,
    imageUrl: input.imageUrl,
    status: 'draft',
  });

  return product;
}

// ─────────────────────────────────────────────────────────────────
// 商品更新（部分更新）
// ─────────────────────────────────────────────────────────────────

export async function updateProduct(
  rawInput: unknown,
  context: ProductContext
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
// ステータス変更
// ─────────────────────────────────────────────────────────────────

export async function updateProductStatus(
  rawInput: unknown,
  context: ProductContext
): Promise<UpdateProductStatusOutput> {
  authorize(context.session, 'admin');

  const input = validate(UpdateProductStatusInputSchema, rawInput);

  const existing = await context.repository.findById(input.id);
  if (!existing) {
    throw new NotFoundError('商品が見つかりません');
  }

  const product = await context.repository.update(input.id, {
    status: input.status,
  });

  return product;
}

// ─────────────────────────────────────────────────────────────────
// 商品削除
// ─────────────────────────────────────────────────────────────────

export async function deleteProduct(
  rawInput: unknown,
  context: ProductContext
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
