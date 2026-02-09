/**
 * エラーコード定義
 * ECサイト向けアーキテクチャ基盤 - 共通エラー型
 */

/**
 * エラーコード一覧
 */
export const ErrorCode = {
  /** 未認証 - ログインが必要 */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** 認可失敗 - 権限不足 */
  FORBIDDEN: 'FORBIDDEN',
  /** 入力検証エラー */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** リソース未存在 */
  NOT_FOUND: 'NOT_FOUND',
  /** 状態競合 */
  CONFLICT: 'CONFLICT',
  /** 内部エラー */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  /** ドメイン未実装 */
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * フィールドエラー（バリデーションエラー用）
 */
export interface FieldError {
  /** フィールド名 */
  field: string;
  /** エラーメッセージ */
  message: string;
}

/**
 * APIエラーレスポンス
 */
export interface ApiError {
  /** エラーコード */
  code: ErrorCode;
  /** ユーザー向けメッセージ（安全にマスクされた内容） */
  message: string;
  /** フィールドエラー（VALIDATION_ERROR の場合のみ） */
  fieldErrors?: FieldError[];
}

/**
 * HTTPステータスコードとエラーコードのマッピング
 */
export const ErrorCodeToHttpStatus: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.NOT_IMPLEMENTED]: 501,
};

/**
 * デフォルトエラーメッセージ（安全なメッセージ）
 */
export const DefaultErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.UNAUTHORIZED]: 'ログインが必要です',
  [ErrorCode.FORBIDDEN]: 'この操作を行う権限がありません',
  [ErrorCode.VALIDATION_ERROR]: '入力内容に誤りがあります',
  [ErrorCode.NOT_FOUND]: '指定されたリソースが見つかりません',
  [ErrorCode.CONFLICT]: '操作が競合しました。再度お試しください',
  [ErrorCode.INTERNAL_ERROR]: 'システムエラーが発生しました',
  [ErrorCode.NOT_IMPLEMENTED]: 'ドメイン未実装です',
};
