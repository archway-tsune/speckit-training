/**
 * セッション管理 単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSession,
  getSession,
  destroySession,
  isSessionValid,
  type SessionData,
} from '@/foundation/auth/session';

describe('セッション管理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession - セッション生成', () => {
    describe('正常系', () => {
      it('Given 有効なユーザー情報, When セッション生成, Then セッションデータが返される', async () => {
        // Arrange
        const userId = '550e8400-e29b-41d4-a716-446655440000';
        const role = 'buyer' as const;

        // Act
        const session = await createSession({ userId, role });

        // Assert
        expect(session).toBeDefined();
        expect(session.userId).toBe(userId);
        expect(session.role).toBe(role);
      });

      it('Given adminロール, When セッション生成, Then adminロールでセッションが作成される', async () => {
        // Arrange
        const userId = '550e8400-e29b-41d4-a716-446655440001';
        const role = 'admin' as const;

        // Act
        const session = await createSession({ userId, role });

        // Assert
        expect(session.role).toBe('admin');
      });
    });

    describe('異常系', () => {
      it('Given 空のユーザーID, When セッション生成, Then エラーが発生する', async () => {
        // Arrange
        const userId = '';
        const role = 'buyer' as const;

        // Act & Assert
        await expect(createSession({ userId, role })).rejects.toThrow();
      });

      it('Given 無効なロール, When セッション生成, Then エラーが発生する', async () => {
        // Arrange
        const userId = '550e8400-e29b-41d4-a716-446655440000';
        const role = 'invalid' as unknown as 'buyer' | 'admin';

        // Act & Assert
        await expect(createSession({ userId, role })).rejects.toThrow();
      });
    });
  });

  describe('getSession - セッション取得', () => {
    describe('正常系', () => {
      it('Given 有効なセッションID, When セッション取得, Then セッションデータが返される', async () => {
        // Arrange
        const mockSessionData: SessionData = {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: 'buyer',
        };

        // Act
        const session = await getSession('valid-session-id');

        // Assert
        // Note: 実装時にモックまたはストア経由で検証
        expect(session).toBeDefined();
      });
    });

    describe('異常系', () => {
      it('Given 無効なセッションID, When セッション取得, Then nullが返される', async () => {
        // Act
        const session = await getSession('invalid-session-id');

        // Assert
        expect(session).toBeNull();
      });

      it('Given 期限切れセッションID, When セッション取得, Then nullが返される', async () => {
        // Act
        const session = await getSession('expired-session-id');

        // Assert
        expect(session).toBeNull();
      });
    });
  });

  describe('destroySession - セッション破棄', () => {
    describe('正常系', () => {
      it('Given 有効なセッションID, When セッション破棄, Then 成功する', async () => {
        // Act & Assert
        await expect(destroySession('valid-session-id')).resolves.not.toThrow();
      });
    });
  });

  describe('isSessionValid - セッション有効性確認', () => {
    describe('正常系', () => {
      it('Given 有効なセッションデータ, When 有効性確認, Then trueが返される', () => {
        // Arrange
        const session: SessionData = {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          role: 'buyer',
        };

        // Act
        const result = isSessionValid(session);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('異常系', () => {
      it('Given nullセッション, When 有効性確認, Then falseが返される', () => {
        // Act
        const result = isSessionValid(null);

        // Assert
        expect(result).toBe(false);
      });

      it('Given undefinedセッション, When 有効性確認, Then falseが返される', () => {
        // Act
        const result = isSessionValid(undefined);

        // Assert
        expect(result).toBe(false);
      });
    });
  });
});
