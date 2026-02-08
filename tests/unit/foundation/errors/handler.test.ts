/**
 * エラーハンドラ 単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect } from 'vitest';
import {
  AppError,
  createError,
  handleError,
  maskErrorForClient,
  ErrorCode,
  type ApiError,
} from '@/foundation/errors/handler';

describe('エラーハンドラ', () => {
  describe('createError - エラー生成', () => {
    describe('正常系', () => {
      it('Given UNAUTHORIZEDコード, When エラー生成, Then 適切なエラーが生成される', () => {
        // Act
        const error = createError('UNAUTHORIZED');

        // Assert
        expect(error).toBeInstanceOf(AppError);
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toBe('ログインが必要です');
      });

      it('Given カスタムメッセージ, When エラー生成, Then カスタムメッセージが使用される', () => {
        // Act
        const error = createError('FORBIDDEN', 'カスタムメッセージ');

        // Assert
        expect(error.message).toBe('カスタムメッセージ');
      });

      it('Given VALIDATION_ERROR, When フィールドエラー付きで生成, Then フィールドエラーが含まれる', () => {
        // Arrange
        const fieldErrors = [
          { field: 'email', message: 'メールアドレスが無効です' },
        ];

        // Act
        const error = createError('VALIDATION_ERROR', undefined, fieldErrors);

        // Assert
        expect(error.fieldErrors).toEqual(fieldErrors);
      });
    });
  });

  describe('handleError - エラー処理', () => {
    describe('正常系', () => {
      it('Given AppError, When エラー処理, Then 適切なAPIエラーが返される', () => {
        // Arrange
        const error = createError('NOT_FOUND');

        // Act
        const result = handleError(error);

        // Assert
        expect(result.code).toBe('NOT_FOUND');
        expect(result.httpStatus).toBe(404);
      });

      it('Given 一般的なError, When エラー処理, Then INTERNAL_ERRORとして処理される', () => {
        // Arrange
        const error = new Error('予期しないエラー');

        // Act
        const result = handleError(error);

        // Assert
        expect(result.code).toBe('INTERNAL_ERROR');
        expect(result.httpStatus).toBe(500);
      });
    });
  });

  describe('maskErrorForClient - クライアント向けマスキング', () => {
    describe('正常系', () => {
      it('Given UNAUTHORIZED, When マスキング, Then 安全なメッセージが返される', () => {
        // Arrange
        const error = createError('UNAUTHORIZED');

        // Act
        const masked = maskErrorForClient(error);

        // Assert
        expect(masked.code).toBe('UNAUTHORIZED');
        expect(masked.message).toBe('ログインが必要です');
      });

      it('Given INTERNAL_ERROR, When マスキング, Then 詳細が隠蔽される', () => {
        // Arrange
        const error = createError('INTERNAL_ERROR', 'データベース接続エラー: password=secret');

        // Act
        const masked = maskErrorForClient(error);

        // Assert
        expect(masked.code).toBe('INTERNAL_ERROR');
        expect(masked.message).toBe('システムエラーが発生しました');
        expect(masked.message).not.toContain('password');
      });

      it('Given VALIDATION_ERROR, When マスキング, Then フィールドエラーが保持される', () => {
        // Arrange
        const fieldErrors = [
          { field: 'email', message: 'メールアドレスが無効です' },
        ];
        const error = createError('VALIDATION_ERROR', undefined, fieldErrors);

        // Act
        const masked = maskErrorForClient(error);

        // Assert
        expect(masked.fieldErrors).toEqual(fieldErrors);
      });
    });
  });

  describe('ErrorCode定数', () => {
    it('すべてのエラーコードが定義されている', () => {
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCode.CONFLICT).toBe('CONFLICT');
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });
  });
});
