/**
 * CSRF対策 単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect } from 'vitest';
import {
  generateCsrfToken,
  validateCsrfToken,
  CsrfError,
} from '@/foundation/auth/csrf';

describe('CSRF対策', () => {
  describe('generateCsrfToken - トークン生成', () => {
    describe('正常系', () => {
      it('Given セッションID, When トークン生成, Then 有効なトークンが返される', () => {
        // Arrange
        const sessionId = 'test-session-id';

        // Act
        const token = generateCsrfToken(sessionId);

        // Assert
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThanOrEqual(32);
      });

      it('Given 同じセッションID, When 複数回トークン生成, Then 異なるトークンが返される', () => {
        // Arrange
        const sessionId = 'test-session-id';

        // Act
        const token1 = generateCsrfToken(sessionId);
        const token2 = generateCsrfToken(sessionId);

        // Assert
        expect(token1).not.toBe(token2);
      });
    });
  });

  describe('validateCsrfToken - トークン検証', () => {
    describe('正常系', () => {
      it('Given 有効なトークン, When 検証, Then trueが返される', () => {
        // Arrange
        const sessionId = 'test-session-id';
        const token = generateCsrfToken(sessionId);

        // Act
        const result = validateCsrfToken(sessionId, token);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('異常系', () => {
      it('Given 無効なトークン, When 検証, Then falseが返される', () => {
        // Arrange
        const sessionId = 'test-session-id';
        const invalidToken = 'invalid-token';

        // Act
        const result = validateCsrfToken(sessionId, invalidToken);

        // Assert
        expect(result).toBe(false);
      });

      it('Given 異なるセッションIDのトークン, When 検証, Then falseが返される', () => {
        // Arrange
        const sessionId1 = 'session-1';
        const sessionId2 = 'session-2';
        const token = generateCsrfToken(sessionId1);

        // Act
        const result = validateCsrfToken(sessionId2, token);

        // Assert
        expect(result).toBe(false);
      });

      it('Given 空のトークン, When 検証, Then falseが返される', () => {
        // Arrange
        const sessionId = 'test-session-id';

        // Act
        const result = validateCsrfToken(sessionId, '');

        // Assert
        expect(result).toBe(false);
      });
    });
  });
});
