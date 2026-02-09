/**
 * Catalog ドメイン - API スタブ実装
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

export function getProducts(..._args: unknown[]): never {
  throw new NotImplementedError('catalog', 'getProducts');
}

export function getProductById(..._args: unknown[]): never {
  throw new NotImplementedError('catalog', 'getProductById');
}

export function createProduct(..._args: unknown[]): never {
  throw new NotImplementedError('catalog', 'createProduct');
}

export function updateProduct(..._args: unknown[]): never {
  throw new NotImplementedError('catalog', 'updateProduct');
}

export function deleteProduct(..._args: unknown[]): never {
  throw new NotImplementedError('catalog', 'deleteProduct');
}
