/**
 * セッション確認API
 */
import { NextResponse } from 'next/server';
import { getServerSession, getDemoUserName } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json(
      error(ErrorCode.UNAUTHORIZED, '未認証'),
      { status: 401 }
    );
  }

  return NextResponse.json(success({
    userId: session.userId,
    role: session.role,
    name: getDemoUserName(session.role),
  }));
}
