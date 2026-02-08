/**
 * エラーハンドラ
 * ECサイト向けアーキテクチャ基盤 - 共通エラー処理
 */
import {
  ErrorCode,
  ErrorCodeToHttpStatus,
  DefaultErrorMessages,
  type FieldError,
  type ApiError,
} from './types';

// Re-export types
export { ErrorCode, type FieldError, type ApiError };

/**
 * アプリケーションエラー
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors?: FieldError[];
  readonly originalError?: Error;

  constructor(
    code: ErrorCode,
    message?: string,
    fieldErrors?: FieldError[],
    originalError?: Error
  ) {
    super(message ?? DefaultErrorMessages[code]);
    this.name = 'AppError';
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.originalError = originalError;
  }
}

/**
 * エラーを生成する
 * @param code エラーコード
 * @param message カスタムメッセージ
 * @param fieldErrors フィールドエラー
 * @returns AppError
 */
export function createError(
  code: ErrorCode,
  message?: string,
  fieldErrors?: FieldError[]
): AppError {
  return new AppError(code, message, fieldErrors);
}

/**
 * エラー処理結果
 */
export interface ErrorHandleResult {
  code: ErrorCode;
  message: string;
  httpStatus: number;
  fieldErrors?: FieldError[];
}

/**
 * エラーを処理する
 * @param error エラー
 * @returns 処理結果
 */
export function handleError(error: unknown): ErrorHandleResult {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      httpStatus: ErrorCodeToHttpStatus[error.code],
      fieldErrors: error.fieldErrors,
    };
  }

  // 予期しないエラーは INTERNAL_ERROR として処理
  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: DefaultErrorMessages[ErrorCode.INTERNAL_ERROR],
    httpStatus: 500,
  };
}

/**
 * クライアント向けにエラーをマスキングする
 * @param error エラー
 * @returns マスキングされたAPIエラー
 */
export function maskErrorForClient(error: AppError | unknown): ApiError {
  const result = handleError(error);

  // INTERNAL_ERRORの場合は詳細を隠蔽
  if (result.code === ErrorCode.INTERNAL_ERROR) {
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: DefaultErrorMessages[ErrorCode.INTERNAL_ERROR],
    };
  }

  // VALIDATION_ERRORの場合はフィールドエラーを保持
  if (result.code === ErrorCode.VALIDATION_ERROR && result.fieldErrors) {
    return {
      code: result.code,
      message: result.message,
      fieldErrors: result.fieldErrors,
    };
  }

  return {
    code: result.code,
    message: result.message,
  };
}
