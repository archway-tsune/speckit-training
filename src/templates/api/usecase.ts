/**
 * ユースケーステンプレート
 * 認可 → バリデーション → ビジネスロジック の標準フローを提供
 */
import { z, type ZodSchema } from 'zod';
import { authorize, type Role } from '@/foundation/auth/authorize';
import { validate, ValidationError } from '@/foundation/validation/runtime';

/**
 * セッション型
 */
export interface SessionData {
  userId: string;
  role: Role;
}

/**
 * ユースケースコンテキスト
 */
export interface UseCaseContext {
  session: SessionData;
}

/**
 * ユースケース設定
 */
export interface UseCaseConfig<TInput, TOutput> {
  /** 入力スキーマ */
  inputSchema: ZodSchema<TInput>;
  /** 出力スキーマ */
  outputSchema: ZodSchema<TOutput>;
  /** 必要なロール */
  requiredRole: Role | Role[];
  /** 実行ロジック */
  execute: (input: TInput, context: UseCaseContext) => Promise<TOutput>;
}

/**
 * ユースケース関数の型
 */
export type UseCase<TInput, TOutput> = (
  input: unknown,
  context: UseCaseContext
) => Promise<TOutput>;

/**
 * 認可エラー
 */
class ForbiddenError extends Error {
  constructor(message = 'FORBIDDEN') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * バリデーションエラー（ラップ）
 */
class UseCaseValidationError extends Error {
  constructor(message = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'UseCaseValidationError';
  }
}

/**
 * ユースケースを生成する
 * @param config ユースケース設定
 * @returns ユースケース関数
 */
export function createUseCase<TInput, TOutput>(
  config: UseCaseConfig<TInput, TOutput>
): UseCase<TInput, TOutput> {
  return async (rawInput: unknown, context: UseCaseContext): Promise<TOutput> => {
    // 1. 認可チェック
    try {
      authorize(context.session, config.requiredRole);
    } catch {
      throw new ForbiddenError();
    }

    // 2. バリデーション
    let input: TInput;
    try {
      input = validate(config.inputSchema, rawInput);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new UseCaseValidationError();
      }
      throw error;
    }

    // 3. ビジネスロジック実行
    const output = await config.execute(input, context);

    // 4. 出力スキーマで検証（開発時のみ）
    if (process.env.NODE_ENV !== 'production') {
      validate(config.outputSchema, output);
    }

    return output;
  };
}
