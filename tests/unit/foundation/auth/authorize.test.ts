/**
 * 認可（RBAC）基盤 単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect } from 'vitest';
import {
  authorize,
  hasRole,
  ForbiddenError,
  type Role,
} from '@/foundation/auth/authorize';
import type { SessionData } from '@/foundation/auth/session';

describe('認可（RBAC）基盤', () => {
  describe('authorize - 認可チェック', () => {
    describe('正常系', () => {
      it('Given buyerロール, When buyer権限が必要な操作, Then 成功する', () => {
        // Arrange
        const session: SessionData = {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: 'buyer',
        };

        // Act & Assert
        expect(() => authorize(session, 'buyer')).not.toThrow();
      });

      it('Given adminロール, When admin権限が必要な操作, Then 成功する', () => {
        // Arrange
        const session: SessionData = {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: 'admin',
        };

        // Act & Assert
        expect(() => authorize(session, 'admin')).not.toThrow();
      });

      it('Given adminロール, When buyer権限が必要な操作, Then 成功する（admin は buyer を含む）', () => {
        // Arrange
        const session: SessionData = {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: 'admin',
        };

        // Act & Assert
        expect(() => authorize(session, 'buyer')).not.toThrow();
      });

      it('Given buyerロール, When 複数ロールのいずれかが必要, Then 成功する', () => {
        // Arrange
        const session: SessionData = {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: 'buyer',
        };

        // Act & Assert
        expect(() => authorize(session, ['buyer', 'admin'])).not.toThrow();
      });
    });

    describe('異常系', () => {
      it('Given buyerロール, When admin権限が必要な操作, Then ForbiddenErrorがスローされる', () => {
        // Arrange
        const session: SessionData = {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: 'buyer',
        };

        // Act & Assert
        expect(() => authorize(session, 'admin')).toThrow(ForbiddenError);
      });

      it('Given nullセッション, When 認可チェック, Then エラーがスローされる', () => {
        // Act & Assert
        expect(() => authorize(null as unknown as SessionData, 'buyer')).toThrow();
      });
    });
  });

  describe('hasRole - ロール確認', () => {
    describe('正常系', () => {
      it('Given buyerロール, When buyerロール確認, Then trueが返される', () => {
        // Arrange
        const session: SessionData = {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: 'buyer',
        };

        // Act
        const result = hasRole(session, 'buyer');

        // Assert
        expect(result).toBe(true);
      });

      it('Given adminロール, When adminロール確認, Then trueが返される', () => {
        // Arrange
        const session: SessionData = {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: 'admin',
        };

        // Act
        const result = hasRole(session, 'admin');

        // Assert
        expect(result).toBe(true);
      });

      it('Given adminロール, When buyerロール確認, Then trueが返される（adminはbuyerを包含）', () => {
        // Arrange
        const session: SessionData = {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: 'admin',
        };

        // Act
        const result = hasRole(session, 'buyer');

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('異常系', () => {
      it('Given buyerロール, When adminロール確認, Then falseが返される', () => {
        // Arrange
        const session: SessionData = {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: 'buyer',
        };

        // Act
        const result = hasRole(session, 'admin');

        // Assert
        expect(result).toBe(false);
      });
    });
  });
});
