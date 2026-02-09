/**
 * 共通レスポンス形式
 * クライアント向けの統一されたAPIレスポンス
 */
import { z } from 'zod';
import { ErrorCode, type FieldError } from './types';

/**
 * 成功レスポンス
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    fieldErrors?: FieldError[];
  };
}

/**
 * APIレスポンス型
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * 成功レスポンスを生成する
 */
export function success<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * エラーレスポンスを生成する
 */
export function error(
  code: ErrorCode,
  message: string,
  fieldErrors?: FieldError[]
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      fieldErrors,
    },
  };
}

/**
 * 成功レスポンススキーマを生成する
 */
export function createSuccessResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

/**
 * エラーレスポンススキーマ
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.nativeEnum(ErrorCode),
    message: z.string(),
    fieldErrors: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
        })
      )
      .optional(),
  }),
});
