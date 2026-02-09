/**
 * エラーマスキング
 * ECサイト向けアーキテクチャ基盤 - クライアント向けエラーマスク
 */
import { maskErrorForClient, type ApiError } from './handler';
import { ErrorCode, DefaultErrorMessages } from './types';

/**
 * 機密情報パターン（マスキング対象）
 */
const SENSITIVE_PATTERNS = [
  /password\s*[=:]\s*\S+/gi,
  /token\s*[=:]\s*\S+/gi,
  /secret\s*[=:]\s*\S+/gi,
  /api[_-]?key\s*[=:]\s*\S+/gi,
  /authorization\s*[=:]\s*\S+/gi,
  /bearer\s+\S+/gi,
];

/**
 * メッセージから機密情報をマスキングする
 * @param message メッセージ
 * @returns マスキングされたメッセージ
 */
export function maskSensitiveInfo(message: string): string {
  let masked = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    masked = masked.replace(pattern, '[REDACTED]');
  }
  return masked;
}

/**
 * ログ出力用にエラーをフォーマットする（個人情報除外）
 * @param error エラー
 * @returns ログ用文字列
 */
export function formatErrorForLog(error: unknown): string {
  if (error instanceof Error) {
    const message = maskSensitiveInfo(error.message);
    const stack = error.stack ? maskSensitiveInfo(error.stack) : '';
    return `${error.name}: ${message}\n${stack}`;
  }
  return String(error);
}

// Re-export for convenience
export { maskErrorForClient, type ApiError };
