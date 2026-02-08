/**
 * CSRF対策
 * ECサイト向けアーキテクチャ基盤 - Double Submit Cookie パターン
 */

// トークンストア（本番では Redis 等に置き換え）
const tokenStore = new Map<string, Set<string>>();

/**
 * CSRFエラー
 */
export class CsrfError extends Error {
  constructor(message = 'CSRFトークンが無効です') {
    super(message);
    this.name = 'CsrfError';
  }
}

/**
 * セキュアなトークンを生成する
 */
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRFトークンを生成する
 * @param sessionId セッションID
 * @returns CSRFトークン
 */
export function generateCsrfToken(sessionId: string): string {
  const token = generateSecureToken();

  // セッションに紐づくトークンセットを取得または作成
  let tokens = tokenStore.get(sessionId);
  if (!tokens) {
    tokens = new Set();
    tokenStore.set(sessionId, tokens);
  }

  // 古いトークンを制限（最大10個）
  if (tokens.size >= 10) {
    const oldest = tokens.values().next().value;
    if (oldest) {
      tokens.delete(oldest);
    }
  }

  tokens.add(token);
  return token;
}

/**
 * CSRFトークンを検証する
 * @param sessionId セッションID
 * @param token 検証するトークン
 * @returns 有効な場合true
 */
export function validateCsrfToken(sessionId: string, token: string): boolean {
  if (!token || token.length === 0) {
    return false;
  }

  const tokens = tokenStore.get(sessionId);
  if (!tokens) {
    return false;
  }

  const isValid = tokens.has(token);

  // 使用済みトークンを削除（ワンタイム）
  if (isValid) {
    tokens.delete(token);
  }

  return isValid;
}

/**
 * セッションのすべてのCSRFトークンを無効化する
 * @param sessionId セッションID
 */
export function invalidateAllCsrfTokens(sessionId: string): void {
  tokenStore.delete(sessionId);
}

/**
 * CSRFトークンを検証し、無効な場合はエラーをスローする
 * @param sessionId セッションID
 * @param token 検証するトークン
 * @throws CsrfError トークンが無効な場合
 */
export function requireValidCsrfToken(sessionId: string, token: string): void {
  if (!validateCsrfToken(sessionId, token)) {
    throw new CsrfError();
  }
}
