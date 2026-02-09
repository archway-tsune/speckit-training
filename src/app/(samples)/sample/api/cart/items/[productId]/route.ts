/**
 * カート更新・削除API
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateCartItem, removeFromCart, CartItemNotFoundError } from '@/samples/domains/cart/api';
import { cartRepository, productFetcher } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';
import { ValidationError } from '@/foundation/validation/runtime';

type Params = { params: Promise<{ productId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const { productId } = await params;
    const body = await request.json();
    const result = await updateCartItem({ ...body, productId }, {
      session,
      repository: cartRepository,
      productFetcher,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    if (err instanceof CartItemNotFoundError) {
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
    console.error('PUT /api/cart/items/[productId] error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const { productId } = await params;
    const result = await removeFromCart({ productId }, {
      session,
      repository: cartRepository,
      productFetcher,
    });

    return NextResponse.json(success(result));
  } catch (err) {
    if (err instanceof CartItemNotFoundError) {
      return NextResponse.json(
        error(ErrorCode.NOT_FOUND, err.message),
        { status: 404 }
      );
    }
    console.error('DELETE /api/cart/items/[productId] error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
      { status: 500 }
    );
  }
}
