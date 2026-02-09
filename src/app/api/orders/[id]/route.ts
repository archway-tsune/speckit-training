/**
 * 注文詳細・ステータス更新API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus, NotFoundError, InvalidStatusTransitionError, NotImplementedError } from '@/domains/orders/api';
import { orderRepository, cartFetcher } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';
import { ValidationError } from '@/foundation/validation/runtime';
import { ForbiddenError } from '@/foundation/auth/authorize';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await getOrderById({ id }, {
      session,
      repository: orderRepository,
      cartFetcher,
    });

    return NextResponse.json(success(result));
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
    console.error('GET /api/orders/[id] error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
      { status: 500 }
    );
  }
}

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
    const result = await updateOrderStatus({ ...body, id }, {
      session,
      repository: orderRepository,
      cartFetcher,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    if (err instanceof NotImplementedError) {
      return NextResponse.json(
        error(ErrorCode.NOT_IMPLEMENTED, err.message),
        { status: 501 }
      );
    }
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
    if (err instanceof InvalidStatusTransitionError) {
      return NextResponse.json(
        error(ErrorCode.VALIDATION_ERROR, err.message),
        { status: 400 }
      );
    }
    if (err instanceof ValidationError) {
      return NextResponse.json(
        error(ErrorCode.VALIDATION_ERROR, err.message, err.fieldErrors),
        { status: 400 }
      );
    }
    console.error('PATCH /api/orders/[id] error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
      { status: 500 }
    );
  }
}
