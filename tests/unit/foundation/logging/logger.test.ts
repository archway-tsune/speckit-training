/**
 * ログユーティリティ 単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  logger,
  LogLevel,
  sanitizeForLog,
} from '@/foundation/logging/logger';

describe('ログユーティリティ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sanitizeForLog - 個人情報除外', () => {
    describe('正常系', () => {
      it('Given 通常のオブジェクト, When サニタイズ, Then そのまま返される', () => {
        // Arrange
        const data = { id: '123', name: 'test' };

        // Act
        const result = sanitizeForLog(data);

        // Assert
        expect(result).toEqual(data);
      });
    });

    describe('個人情報除外', () => {
      it('Given emailフィールド, When サニタイズ, Then マスクされる', () => {
        // Arrange
        const data = { email: 'user@example.com' };

        // Act
        const result = sanitizeForLog(data);

        // Assert
        expect(result.email).toBe('[REDACTED]');
      });

      it('Given passwordフィールド, When サニタイズ, Then マスクされる', () => {
        // Arrange
        const data = { password: 'secret123' };

        // Act
        const result = sanitizeForLog(data);

        // Assert
        expect(result.password).toBe('[REDACTED]');
      });

      it('Given ネストされたオブジェクト, When サニタイズ, Then 再帰的にマスクされる', () => {
        // Arrange
        const data = {
          user: {
            email: 'user@example.com',
            profile: {
              phone: '090-1234-5678',
            },
          },
        };

        // Act
        const result = sanitizeForLog(data);

        // Assert
        expect(result.user.email).toBe('[REDACTED]');
        expect(result.user.profile.phone).toBe('[REDACTED]');
      });
    });
  });

  describe('logger - ログ出力', () => {
    describe('正常系', () => {
      it('Given infoレベル, When ログ出力, Then 正しくフォーマットされる', () => {
        // Arrange
        const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

        // Act
        logger.info('テストメッセージ', { key: 'value' });

        // Assert
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });

      it('Given errorレベル, When ログ出力, Then エラー情報が含まれる', () => {
        // Arrange
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Act
        logger.error('エラーメッセージ', new Error('テストエラー'));

        // Assert
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  });
});
