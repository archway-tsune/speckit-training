/**
 * Cart ドメイン - ユースケース
 * カート関連のビジネスロジック
 */
import type { Session } from '@/foundation/auth/session';
import { authorize } from '@/foundation/auth/authorize';
import { validate, ValidationError } from '@/foundation/validation/runtime';
import {
  GetCartInputSchema,
  AddToCartInputSchema,
  UpdateCartItemInputSchema,
  RemoveFromCartInputSchema,
  type GetCartOutput,
  type AddToCartOutput,
  type UpdateCartItemOutput,
  type RemoveFromCartOutput,
  type CartRepository,
  type ProductFetcher,
} from '@/contracts/cart';

// ─────────────────────────────────────────────────────────────────
// コンテキスト
// ─────────────────────────────────────────────────────────────────

export interface CartContext {
  session: Session;
  repository: CartRepository;
  productFetcher: ProductFetcher;
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

export class CartItemNotFoundError extends Error {
  constructor(productId: string) {
    super(`カート内に商品が見つかりません: ${productId}`);
    this.name = 'CartItemNotFoundError';
  }
}

// ─────────────────────────────────────────────────────────────────
// カート取得
// ─────────────────────────────────────────────────────────────────

export async function getCart(
  rawInput: unknown,
  context: CartContext
): Promise<GetCartOutput> {
  authorize(context.session, 'buyer');
  validate(GetCartInputSchema, rawInput);

  let cart = await context.repository.findByUserId(context.session.userId);

  if (!cart) {
    cart = await context.repository.create(context.session.userId);
  }

  return cart;
}

// ─────────────────────────────────────────────────────────────────
// カート追加
// ─────────────────────────────────────────────────────────────────

export async function addToCart(
  rawInput: unknown,
  context: CartContext
): Promise<AddToCartOutput> {
  authorize(context.session, 'buyer');

  const input = validate(AddToCartInputSchema, rawInput);

  // 商品存在確認
  const product = await context.productFetcher.findById(input.productId);
  if (!product) {
    throw new NotFoundError('商品が見つかりません');
  }

  // 在庫切れチェック
  if (product.stock === 0) {
    throw new ValidationError([{ field: 'productId', message: '在庫が不足しています' }]);
  }

  // 既存カートの同一商品チェック（在庫超過防止）
  const existingCart = await context.repository.findByUserId(context.session.userId);
  if (existingCart) {
    const existingItem = existingCart.items.find((item) => item.productId === input.productId);
    const currentQuantity = existingItem?.quantity ?? 0;
    const newTotal = currentQuantity + (input.quantity ?? 1);
    if (newTotal > product.stock) {
      throw new ValidationError([{ field: 'quantity', message: '在庫数を超えています' }]);
    }
  } else {
    if ((input.quantity ?? 1) > product.stock) {
      throw new ValidationError([{ field: 'quantity', message: '在庫数を超えています' }]);
    }
  }

  const cart = await context.repository.addItem(context.session.userId, {
    productId: product.id,
    productName: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    quantity: input.quantity ?? 1,
  });

  return cart;
}

// ─────────────────────────────────────────────────────────────────
// カート更新
// ─────────────────────────────────────────────────────────────────

export async function updateCartItem(
  rawInput: unknown,
  context: CartContext
): Promise<UpdateCartItemOutput> {
  authorize(context.session, 'buyer');

  const input = validate(UpdateCartItemInputSchema, rawInput);

  const existingCart = await context.repository.findByUserId(context.session.userId);
  if (!existingCart) {
    throw new CartItemNotFoundError(input.productId);
  }

  const itemExists = existingCart.items.some((item) => item.productId === input.productId);
  if (!itemExists) {
    throw new CartItemNotFoundError(input.productId);
  }

  // 在庫チェック
  const product = await context.productFetcher.findById(input.productId);
  if (product && input.quantity > product.stock) {
    throw new ValidationError([{ field: 'quantity', message: '在庫数を超えています' }]);
  }

  const cart = await context.repository.updateItemQuantity(
    context.session.userId,
    input.productId,
    input.quantity
  );

  return cart;
}

// ─────────────────────────────────────────────────────────────────
// カート削除
// ─────────────────────────────────────────────────────────────────

export async function removeFromCart(
  rawInput: unknown,
  context: CartContext
): Promise<RemoveFromCartOutput> {
  authorize(context.session, 'buyer');

  const input = validate(RemoveFromCartInputSchema, rawInput);

  const existingCart = await context.repository.findByUserId(context.session.userId);
  if (!existingCart) {
    throw new CartItemNotFoundError(input.productId);
  }

  const itemExists = existingCart.items.some((item) => item.productId === input.productId);
  if (!itemExists) {
    throw new CartItemNotFoundError(input.productId);
  }

  const cart = await context.repository.removeItem(context.session.userId, input.productId);

  return cart;
}
