/**
 * レスポンス形式統合テスト
 * APIレスポンスの生成・検証の実際の挙動を検証
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  success,
  error,
  createSuccessResponseSchema,
  ErrorResponseSchema,
  type SuccessResponse,
  type ErrorResponse,
  type ApiResponse,
} from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';

describe('レスポンス形式統合テスト', () => {
  describe('success関数', () => {
    it('任意のデータで成功レスポンスを生成する', () => {
      const data = { id: '123', name: 'テスト' };
      const response = success(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
    });

    it('配列データで成功レスポンスを生成する', () => {
      const data = [1, 2, 3];
      const response = success(data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual([1, 2, 3]);
    });

    it('nullデータで成功レスポンスを生成する', () => {
      const response = success(null);

      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });

    it('プリミティブデータで成功レスポンスを生成する', () => {
      const stringResponse = success('hello');
      const numberResponse = success(42);
      const boolResponse = success(true);

      expect(stringResponse.data).toBe('hello');
      expect(numberResponse.data).toBe(42);
      expect(boolResponse.data).toBe(true);
    });
  });

  describe('error関数', () => {
    it('基本的なエラーレスポンスを生成する', () => {
      const response = error(ErrorCode.VALIDATION_ERROR, 'バリデーションエラーです');

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(response.error.message).toBe('バリデーションエラーです');
      expect(response.error.fieldErrors).toBeUndefined();
    });

    it('フィールドエラー付きのエラーレスポンスを生成する', () => {
      const fieldErrors = [
        { field: 'email', message: 'メールアドレスの形式が不正です' },
        { field: 'password', message: 'パスワードは8文字以上です' },
      ];
      const response = error(ErrorCode.VALIDATION_ERROR, '入力エラーがあります', fieldErrors);

      expect(response.error.fieldErrors).toHaveLength(2);
      expect(response.error.fieldErrors?.[0].field).toBe('email');
      expect(response.error.fieldErrors?.[1].message).toBe('パスワードは8文字以上です');
    });

    it('各エラーコードでレスポンスを生成する', () => {
      const errorCodes = [
        ErrorCode.UNAUTHORIZED,
        ErrorCode.FORBIDDEN,
        ErrorCode.NOT_FOUND,
        ErrorCode.CONFLICT,
        ErrorCode.INTERNAL_ERROR,
      ];

      for (const code of errorCodes) {
        const response = error(code, 'テストメッセージ');
        expect(response.error.code).toBe(code);
      }
    });
  });

  describe('createSuccessResponseSchema', () => {
    it('カスタムスキーマで成功レスポンスを検証する', () => {
      const UserSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
      });

      const UserResponseSchema = createSuccessResponseSchema(UserSchema);

      const validResponse = {
        success: true as const,
        data: {
          id: '123',
          name: 'テストユーザー',
          email: 'test@example.com',
        },
      };

      const result = UserResponseSchema.parse(validResponse);
      expect(result.data.email).toBe('test@example.com');
    });

    it('不正なデータを含む成功レスポンスを拒否する', () => {
      const UserSchema = z.object({
        id: z.string(),
        email: z.string().email(),
      });

      const UserResponseSchema = createSuccessResponseSchema(UserSchema);

      const invalidResponse = {
        success: true,
        data: {
          id: '123',
          email: 'invalid-email',
        },
      };

      expect(() => UserResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('success: false の場合に拒否する', () => {
      const DataSchema = z.object({ value: z.number() });
      const ResponseSchema = createSuccessResponseSchema(DataSchema);

      const invalidResponse = {
        success: false,
        data: { value: 100 },
      };

      expect(() => ResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('ErrorResponseSchema', () => {
    it('有効なエラーレスポンスを検証する', () => {
      const response = {
        success: false as const,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'テストエラー',
        },
      };

      const result = ErrorResponseSchema.parse(response);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('フィールドエラー付きレスポンスを検証する', () => {
      const response = {
        success: false as const,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'フィールドエラー',
          fieldErrors: [
            { field: 'name', message: '必須項目です' },
          ],
        },
      };

      const result = ErrorResponseSchema.parse(response);
      expect(result.error.fieldErrors).toHaveLength(1);
    });

    it('不正なエラーコードを拒否する', () => {
      const response = {
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'テスト',
        },
      };

      expect(() => ErrorResponseSchema.parse(response)).toThrow();
    });

    it('success: true の場合に拒否する', () => {
      const response = {
        success: true,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'エラー',
        },
      };

      expect(() => ErrorResponseSchema.parse(response)).toThrow();
    });
  });

  describe('型の整合性', () => {
    it('SuccessResponse型は正しい構造を持つ', () => {
      const response: SuccessResponse<{ id: string }> = {
        success: true,
        data: { id: '123' },
      };

      expect(response.success).toBe(true);
      expect(response.data.id).toBe('123');
    });

    it('ErrorResponse型は正しい構造を持つ', () => {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: ErrorCode.NOT_FOUND,
          message: '見つかりません',
        },
      };

      expect(response.success).toBe(false);
      expect(response.error.code).toBe(ErrorCode.NOT_FOUND);
    });

    it('ApiResponse型はユニオンとして機能する', () => {
      function processResponse(response: ApiResponse<{ value: number }>) {
        if (response.success) {
          return response.data.value;
        } else {
          return response.error.code;
        }
      }

      const successRes = success({ value: 42 });
      const errorRes = error(ErrorCode.INTERNAL_ERROR, 'エラー');

      expect(processResponse(successRes)).toBe(42);
      expect(processResponse(errorRes)).toBe(ErrorCode.INTERNAL_ERROR);
    });
  });

  describe('実際のAPIシナリオ', () => {
    it('ユーザー取得APIのレスポンスをシミュレートする', () => {
      const UserSchema = z.object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string().email(),
        createdAt: z.coerce.date(),
      });
      const UserResponseSchema = createSuccessResponseSchema(UserSchema);

      // APIからのJSONレスポンスをシミュレート
      const jsonResponse = JSON.stringify({
        success: true,
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'テストユーザー',
          email: 'test@example.com',
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      });

      const parsed = JSON.parse(jsonResponse);
      const result = UserResponseSchema.parse(parsed);

      expect(result.data.createdAt).toBeInstanceOf(Date);
    });

    it('リスト取得APIのレスポンスをシミュレートする', () => {
      const ItemSchema = z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
      });

      const ListResponseSchema = createSuccessResponseSchema(
        z.object({
          items: z.array(ItemSchema),
          total: z.number(),
          page: z.number(),
          limit: z.number(),
        })
      );

      const response = success({
        items: [
          { id: '1', name: '商品A', price: 1000 },
          { id: '2', name: '商品B', price: 2000 },
        ],
        total: 2,
        page: 1,
        limit: 20,
      });

      const result = ListResponseSchema.parse(response);
      expect(result.data.items).toHaveLength(2);
      expect(result.data.total).toBe(2);
    });

    it('バリデーションエラーレスポンスをシミュレートする', () => {
      const response = error(ErrorCode.VALIDATION_ERROR, '入力内容に誤りがあります', [
        { field: 'email', message: '有効なメールアドレスを入力してください' },
        { field: 'password', message: 'パスワードは8文字以上で入力してください' },
      ]);

      const result = ErrorResponseSchema.parse(response);

      expect(result.success).toBe(false);
      expect(result.error.fieldErrors).toHaveLength(2);

      // クライアント側でフィールドエラーを処理
      const fieldErrorMap = new Map(
        result.error.fieldErrors?.map((e) => [e.field, e.message])
      );
      expect(fieldErrorMap.get('email')).toBe('有効なメールアドレスを入力してください');
    });

    it('認証エラーレスポンスをシミュレートする', () => {
      const response = error(ErrorCode.UNAUTHORIZED, 'ログインが必要です');

      const result = ErrorResponseSchema.parse(response);
      expect(result.error.code).toBe(ErrorCode.UNAUTHORIZED);

      // クライアント側でエラーコードに応じた処理を分岐
      switch (result.error.code) {
        case ErrorCode.UNAUTHORIZED:
          // リダイレクト処理
          expect(true).toBe(true);
          break;
        default:
          expect.fail('予期しないエラーコード');
      }
    });
  });
});
