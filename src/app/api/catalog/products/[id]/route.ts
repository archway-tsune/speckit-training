/**
 * 商品詳細・更新・削除API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct, NotFoundError, NotImplementedError } from '@/domains/catalog/api';
import { productRepository } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';
import { ValidationError } from '@/foundation/validation/runtime';
import { ForbiddenError } from '@/foundation/auth/authorize';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    // 商品詳細は公開API（認証不要）
    const session = await getServerSession();

    const { id } = await params;
    const result = await getProductById({ id }, {
      session: session || { userId: 'guest', role: 'buyer' as const, expiresAt: new Date() },
      repository: productRepository,
    });

    return NextResponse.json(success(result));
  } catch (err: unknown) {
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
    console.error('GET /api/catalog/products/[id] error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
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
    const result = await updateProduct({ ...body, id }, {
      session,
      repository: productRepository,
    });

    return NextResponse.json(success(result));
  } catch (err: unknown) {
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
    if (err instanceof ValidationError) {
      return NextResponse.json(
        error(ErrorCode.VALIDATION_ERROR, err.message, err.fieldErrors),
        { status: 400 }
      );
    }
    console.error('PUT /api/catalog/products/[id] error:', err);
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

    const { id } = await params;
    const result = await deleteProduct({ id }, {
      session,
      repository: productRepository,
    });

    return NextResponse.json(success(result));
  } catch (err: unknown) {
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
    console.error('DELETE /api/catalog/products/[id] error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
      { status: 500 }
    );
  }
}
