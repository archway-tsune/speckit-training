/**
 * セッション管理テンプレート
 *
 * 使用例:
 * - Cookie ベースのセッション管理
 * - デモ・開発環境での簡易認証
 *
 * カスタマイズポイント:
 * - SESSION_COOKIE_NAME: セッションCookie名
 * - SESSION_MAX_AGE: セッション有効期限
 * - ユーザーデータストア
 *
 * 注意:
 * - 本番環境では適切な暗号化・署名を実装すること
 * - このテンプレートはデモ用の簡易実装
 */
import { cookies } from 'next/headers';

// ─────────────────────────────────────────────────────────────────
// 設定
// ─────────────────────────────────────────────────────────────────

/** セッションCookie名 */
export const SESSION_COOKIE_NAME = 'session';

/** セッション有効期限（秒） */
export const SESSION_MAX_AGE = 60 * 60 * 24; // 24時間

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

/** セッションデータ */
export interface SessionData {
  userId: string;
  role: string;
}

/** ユーザータイプ別設定 */
export interface UserTypeConfig {
  userId: string;
  role: string;
  name: string;
}

// ─────────────────────────────────────────────────────────────────
// デモ用ユーザーデータ
// ─────────────────────────────────────────────────────────────────

/** デモ用ユーザー設定 */
export const demoUsers: Record<string, UserTypeConfig> = {
  buyer: {
    userId: 'buyer-demo-001',
    role: 'buyer',
    name: '購入者テスト',
  },
  admin: {
    userId: 'admin-demo-001',
    role: 'admin',
    name: '管理者テスト',
  },
};

// ─────────────────────────────────────────────────────────────────
// セッション操作関数
// ─────────────────────────────────────────────────────────────────

/**
 * サーバーサイドでセッションを取得
 */
export async function getServerSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    // デモ用：単純なJSON（本番では暗号化・署名必須）
    const session = JSON.parse(sessionCookie.value) as SessionData;
    return session;
  } catch {
    return null;
  }
}

/**
 * サーバーサイドでセッションを作成
 */
export async function createServerSession(
  userType: keyof typeof demoUsers
): Promise<SessionData> {
  const user = demoUsers[userType];
  if (!user) {
    throw new Error(`Unknown user type: ${userType}`);
  }

  const session: SessionData = {
    userId: user.userId,
    role: user.role,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return session;
}

/**
 * サーバーサイドでセッションを破棄
 */
export async function destroyServerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * デモユーザー名を取得
 */
export function getDemoUserName(role: string): string {
  const user = Object.values(demoUsers).find((u) => u.role === role);
  return user?.name || '不明なユーザー';
}

// ─────────────────────────────────────────────────────────────────
// セッションファクトリ（カスタム実装用）
// ─────────────────────────────────────────────────────────────────

export interface SessionManagerConfig {
  cookieName?: string;
  maxAge?: number;
  /** セッションデータをシリアライズ */
  serialize?: (session: SessionData) => string;
  /** セッションデータをデシリアライズ */
  deserialize?: (value: string) => SessionData | null;
}

/**
 * カスタムセッションマネージャーを生成
 *
 * @example
 * ```typescript
 * const sessionManager = createSessionManager({
 *   cookieName: 'my-app-session',
 *   maxAge: 60 * 60 * 8, // 8時間
 *   serialize: (session) => encrypt(JSON.stringify(session)),
 *   deserialize: (value) => JSON.parse(decrypt(value)),
 * });
 * ```
 */
export function createSessionManager(config: SessionManagerConfig = {}) {
  const {
    cookieName = SESSION_COOKIE_NAME,
    maxAge = SESSION_MAX_AGE,
    serialize = (session) => JSON.stringify(session),
    deserialize = (value) => {
      try {
        return JSON.parse(value) as SessionData;
      } catch {
        return null;
      }
    },
  } = config;

  return {
    async getSession(): Promise<SessionData | null> {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get(cookieName);

      if (!sessionCookie?.value) {
        return null;
      }

      return deserialize(sessionCookie.value);
    },

    async createSession(session: SessionData): Promise<void> {
      const cookieStore = await cookies();
      cookieStore.set(cookieName, serialize(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
        path: '/',
      });
    },

    async destroySession(): Promise<void> {
      const cookieStore = await cookies();
      cookieStore.delete(cookieName);
    },
  };
}

export default {
  getServerSession,
  createServerSession,
  destroyServerSession,
  getDemoUserName,
  createSessionManager,
};
