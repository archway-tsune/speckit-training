/**
 * Runtime Validation
 * ECサイト向けアーキテクチャ基盤 - Zodベースのruntime validation
 */
import { z, ZodError, type ZodSchema } from 'zod';
import { type FieldError } from '../errors/types';

/**
 * バリデーションエラー
 */
export class ValidationError extends Error {
  readonly fieldErrors: FieldError[];

  constructor(fieldErrors: FieldError[], message = '入力内容に誤りがあります') {
    super(message);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

/**
 * ZodErrorをFieldErrorに変換する
 */
function zodErrorToFieldErrors(error: ZodError): FieldError[] {
  return error.errors.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
  }));
}

/**
 * データをスキーマでバリデーションする（同期）
 * @param schema Zodスキーマ
 * @param data バリデーションするデータ
 * @returns バリデーション済みデータ
 * @throws ValidationError バリデーション失敗時
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const fieldErrors = zodErrorToFieldErrors(result.error);
    throw new ValidationError(fieldErrors);
  }

  return result.data;
}

/**
 * データをスキーマでバリデーションする（非同期）
 * @param schema Zodスキーマ
 * @param data バリデーションするデータ
 * @returns バリデーション済みデータ
 * @throws ValidationError バリデーション失敗時
 */
export async function validateAsync<T>(
  schema: ZodSchema<T>,
  data: unknown
): Promise<T> {
  const result = await schema.safeParseAsync(data);

  if (!result.success) {
    const fieldErrors = zodErrorToFieldErrors(result.error);
    throw new ValidationError(fieldErrors);
  }

  return result.data;
}

/**
 * オプショナルなバリデーション（エラーをスローせず結果を返す）
 * @param schema Zodスキーマ
 * @param data バリデーションするデータ
 * @returns バリデーション結果
 */
export function validateSafe<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: FieldError[] } {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: zodErrorToFieldErrors(result.error),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
