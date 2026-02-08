/**
 * サーバーサイドセッション管理
 * デモ用：Cookieベースのシンプルな実装
 */
import { cookies } from 'next/headers';
import type { Session } from '@/foundation/auth/session';

const SESSION_COOKIE = 'ec_session';

// デモユーザー
const demoUsers: Record<string, { userId: string; role: 'buyer' | 'admin'; name: string }> = {
  buyer: {
    userId: '550e8400-e29b-41d4-a716-446655440100',
    role: 'buyer',
    name: '購入者テスト',
  },
  admin: {
    userId: '550e8400-e29b-41d4-a716-446655440101',
    role: 'admin',
    name: '管理者テスト',
  },
};

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const data = JSON.parse(sessionCookie.value);
    return {
      userId: data.userId,
      role: data.role,
      expiresAt: new Date(data.expiresAt),
    };
  } catch {
    return null;
  }
}

export async function createServerSession(userType: 'buyer' | 'admin'): Promise<Session> {
  const user = demoUsers[userType];
  const session: Session = {
    userId: user.userId,
    role: user.role,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60,
    path: '/',
  });

  return session;
}

export async function destroyServerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function getDemoUserName(role: 'buyer' | 'admin'): string {
  return demoUsers[role].name;
}
