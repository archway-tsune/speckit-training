/**
 * ログインAPI
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSession, getDemoUserName } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';

export async function POST(request: NextRequest) {
  try {
    let body: { email?: string } = {};
    try {
      body = await request.json();
    } catch {
      // 空のボディは許容（デモ用自動ログイン）
    }
    const { email } = body;

    // デモ認証: メールアドレスでロールを判定
    const isAdmin = email?.includes('admin');
    const userType = isAdmin ? 'admin' : 'buyer';

    const session = await createServerSession(userType);

    return NextResponse.json(success({
      userId: session.userId,
      role: session.role,
      name: getDemoUserName(userType),
    }));
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'ログインに失敗しました'),
      { status: 500 }
    );
  }
}
