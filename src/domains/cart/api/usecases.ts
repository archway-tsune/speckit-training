/**
 * カートドメイン — 本番ユースケース
 * カート関連のビジネスロジック
 */
import type { Session } from '@/foundation/auth/session';
import { authorize } from '@/foundation/auth/authorize';
import { validate } from '@/foundation/validation/runtime';
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
// 数量変更
// ─────────────────────────────────────────────────────────────────

export async function updateCartItem(
  rawInput: unknown,
  context: CartContext
): Promise<UpdateCartItemOutput> {
  authorize(context.session, 'buyer');

  const input = validate(UpdateCartItemInputSchema, rawInput);

  // カート存在確認
  const cart = await context.repository.findByUserId(context.session.userId);
  if (!cart) {
    throw new CartItemNotFoundError(input.productId);
  }

  // アイテム存在確認
  const item = cart.items.find((i) => i.productId === input.productId);
  if (!item) {
    throw new CartItemNotFoundError(input.productId);
  }

  const updated = await context.repository.updateItemQuantity(
    context.session.userId,
    input.productId,
    input.quantity
  );

  return updated;
}

// ─────────────────────────────────────────────────────────────────
// 商品削除
// ─────────────────────────────────────────────────────────────────

export async function removeFromCart(
  rawInput: unknown,
  context: CartContext
): Promise<RemoveFromCartOutput> {
  authorize(context.session, 'buyer');

  const input = validate(RemoveFromCartInputSchema, rawInput);

  // カート存在確認
  const cart = await context.repository.findByUserId(context.session.userId);
  if (!cart) {
    throw new CartItemNotFoundError(input.productId);
  }

  // アイテム存在確認
  const item = cart.items.find((i) => i.productId === input.productId);
  if (!item) {
    throw new CartItemNotFoundError(input.productId);
  }

  const updated = await context.repository.removeItem(
    context.session.userId,
    input.productId
  );

  return updated;
}
