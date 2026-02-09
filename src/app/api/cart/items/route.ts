/**
 * カート追加API
 */
import { NextRequest, NextResponse } from 'next/server';
import { addToCart, NotFoundError, NotImplementedError } from '@/domains/cart/api';
import { cartRepository, productFetcher } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';
import { ValidationError } from '@/foundation/validation/runtime';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await addToCart(body, {
      session,
      repository: cartRepository,
      productFetcher,
    });

    return NextResponse.json(success(result), { status: 201 });
  } catch (err) {
    if (err instanceof NotImplementedError) {
      return NextResponse.json(
        error(ErrorCode.NOT_IMPLEMENTED, err.message),
        { status: 501 }
      );
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json(
        error(ErrorCode.NOT_FOUND, err.message),
        { status: 404 }
      );
    }
    if (err instanceof ValidationError) {
      return NextResponse.json(
        error(ErrorCode.VALIDATION_ERROR, err.message, err.fieldErrors),
        { status: 400 }
      );
    }
    console.error('POST /api/cart/items error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
      { status: 500 }
    );
  }
}
