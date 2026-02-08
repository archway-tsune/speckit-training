/**
 * 認可（RBAC）基盤
 * ECサイト向けアーキテクチャ基盤 - 認可チェック
 */
import type { SessionData, Role } from './session';

/**
 * ロール階層（adminはbuyerを包含）
 */
const ROLE_HIERARCHY: Record<Role, Role[]> = {
  buyer: ['buyer'],
  admin: ['admin', 'buyer'],
};

/**
 * 認可失敗エラー
 */
export class ForbiddenError extends Error {
  constructor(message = 'この操作を行う権限がありません') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * 指定されたロールを持っているかチェックする
 * @param session セッションデータ
 * @param requiredRole 必要なロール
 * @returns ロールを持っている場合true
 */
export function hasRole(session: SessionData, requiredRole: Role): boolean {
  const userRoles = ROLE_HIERARCHY[session.role];
  return userRoles.includes(requiredRole);
}

/**
 * 認可チェックを行う
 * @param session セッションデータ
 * @param requiredRole 必要なロール（単一または複数）
 * @throws ForbiddenError 認可失敗時
 */
export function authorize(
  session: SessionData,
  requiredRole: Role | Role[]
): void {
  if (!session) {
    throw new ForbiddenError('セッションが無効です');
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const hasRequiredRole = roles.some((role) => hasRole(session, role));

  if (!hasRequiredRole) {
    throw new ForbiddenError();
  }
}

/**
 * ユースケース向け認可デコレータ用のメタデータ
 */
export interface AuthorizeMetadata {
  /** 必要なロール */
  requiredRole: Role | Role[];
  /** 操作説明（監査ログ用） */
  action: string;
}

/**
 * ユースケース認可要件を定義するヘルパー
 */
export function defineAuthorization<T extends Record<string, AuthorizeMetadata>>(
  config: T
): T {
  return config;
}

// Re-export Role type
export type { Role };

/**
 * 認可エラー（ForbiddenErrorのエイリアス）
 */
export const AuthorizationError = ForbiddenError;
export type AuthorizationError = ForbiddenError;
