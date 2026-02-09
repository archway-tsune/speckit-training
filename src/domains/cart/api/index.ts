/**
 * Cart ドメイン - API スタブ実装
 * 本番実装で置き換え予定。すべての関数は NotImplementedError をスローする。
 */

/**
 * ドメイン未実装エラー
 */
export class NotImplementedError extends Error {
  constructor(domain: string, operation: string) {
    super(`ドメイン未実装: ${domain}.${operation}`);
    this.name = 'NotImplementedError';
  }
}

/**
 * リソース未存在エラー（スタブ）
 */
export class NotFoundError extends Error {
  constructor(message = 'リソースが見つかりません') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * カートアイテム未存在エラー（スタブ）
 */
export class CartItemNotFoundError extends Error {
  constructor(message = 'カートアイテムが見つかりません') {
    super(message);
    this.name = 'CartItemNotFoundError';
  }
}

export function getCart(..._args: unknown[]): never {
  throw new NotImplementedError('cart', 'getCart');
}

export function addToCart(..._args: unknown[]): never {
  throw new NotImplementedError('cart', 'addToCart');
}

export function updateCartItem(..._args: unknown[]): never {
  throw new NotImplementedError('cart', 'updateCartItem');
}

export function removeFromCart(..._args: unknown[]): never {
  throw new NotImplementedError('cart', 'removeFromCart');
}
