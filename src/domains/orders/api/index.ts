/**
 * Orders ドメイン - API スタブ実装
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
 * カート空エラー（スタブ）
 */
export class EmptyCartError extends Error {
  constructor(message = 'カートが空です') {
    super(message);
    this.name = 'EmptyCartError';
  }
}

/**
 * 不正なステータス遷移エラー（スタブ）
 */
export class InvalidStatusTransitionError extends Error {
  constructor(message = '不正なステータス遷移です') {
    super(message);
    this.name = 'InvalidStatusTransitionError';
  }
}

export function getOrders(..._args: unknown[]): never {
  throw new NotImplementedError('orders', 'getOrders');
}

export function getOrderById(..._args: unknown[]): never {
  throw new NotImplementedError('orders', 'getOrderById');
}

export function createOrder(..._args: unknown[]): never {
  throw new NotImplementedError('orders', 'createOrder');
}

export function updateOrderStatus(..._args: unknown[]): never {
  throw new NotImplementedError('orders', 'updateOrderStatus');
}
