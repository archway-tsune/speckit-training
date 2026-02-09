/**
 * カート取得API
 */
import { NextResponse } from 'next/server';
import { getCart } from '@/samples/domains/cart/api';
import { cartRepository, productFetcher } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const result = await getCart({}, {
      session,
      repository: cartRepository,
      productFetcher,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    console.error('GET /api/cart error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
      { status: 500 }
    );
  }
}
