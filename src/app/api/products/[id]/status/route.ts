/**
 * 商品ステータス変更API
 * PATCH /api/products/:id/status — ステータス変更
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateProductStatus, NotFoundError, ForbiddenError } from '@/domains/product/api';
import { productRepository } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';
import { ValidationError } from '@/foundation/validation/runtime';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const result = await updateProductStatus({ ...body, id }, {
      session,
      repository: productRepository,
    });

    return NextResponse.json(success(result));
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json(
        error(ErrorCode.FORBIDDEN, err.message),
        { status: 403 }
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
    console.error('PATCH /api/products/[id]/status error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
      { status: 500 }
    );
  }
}
