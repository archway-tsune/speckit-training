/**
 * ログユーティリティ
 * ECサイト向けアーキテクチャ基盤 - ログ出力（個人情報除外）
 */

/**
 * ログレベル
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

/**
 * 個人情報を含むフィールド名（マスキング対象）
 */
const SENSITIVE_FIELDS = new Set([
  'password',
  'email',
  'phone',
  'address',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'ssn',
  'socialSecurityNumber',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'apiKey',
  'api_key',
  'secret',
]);

/**
 * オブジェクトから個人情報をサニタイズする
 * @param data サニタイズするデータ
 * @returns サニタイズされたデータ
 */
export function sanitizeForLog<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForLog(item)) as T;
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeForLog(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized as T;
  }

  return data;
}

/**
 * ログエントリ
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * ログエントリを作成する
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  dataOrError?: unknown
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (dataOrError instanceof Error) {
    entry.error = {
      name: dataOrError.name,
      message: dataOrError.message,
      stack: dataOrError.stack,
    };
  } else if (dataOrError !== undefined) {
    entry.data = sanitizeForLog(dataOrError);
  }

  return entry;
}

/**
 * ログを出力する
 */
function log(level: LogLevel, message: string, dataOrError?: unknown): void {
  const entry = createLogEntry(level, message, dataOrError);
  const output = JSON.stringify(entry);

  switch (level) {
    case LogLevel.DEBUG:
      console.debug(output);
      break;
    case LogLevel.INFO:
      console.info(output);
      break;
    case LogLevel.WARN:
      console.warn(output);
      break;
    case LogLevel.ERROR:
      console.error(output);
      break;
  }
}

/**
 * ロガー
 */
export const logger = {
  debug: (message: string, data?: unknown) => log(LogLevel.DEBUG, message, data),
  info: (message: string, data?: unknown) => log(LogLevel.INFO, message, data),
  warn: (message: string, data?: unknown) => log(LogLevel.WARN, message, data),
  error: (message: string, error?: Error | unknown) => log(LogLevel.ERROR, message, error),
};
