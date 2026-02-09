/**
 * 商品一覧・登録API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct, NotImplementedError } from '@/domains/catalog/api';
import { productRepository } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';
import { ValidationError } from '@/foundation/validation/runtime';
import { ForbiddenError } from '@/foundation/auth/authorize';

export async function GET(request: NextRequest) {
  try {
    // 商品一覧は公開API（認証不要）
    const session = await getServerSession();

    const { searchParams } = new URL(request.url);
    const input = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      // 未認証の場合はpublishedのみ表示
      status: session ? (searchParams.get('status') || undefined) : 'published',
      keyword: searchParams.get('keyword') || undefined,
    };

    const result = await getProducts(input, {
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
    console.error('GET /api/catalog/products error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
      { status: 500 }
    );
  }
}

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
    const result = await createProduct(body, {
      session,
      repository: productRepository,
    });

    return NextResponse.json(success(result), { status: 201 });
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
    if (err instanceof ValidationError) {
      return NextResponse.json(
        error(ErrorCode.VALIDATION_ERROR, err.message, err.fieldErrors),
        { status: 400 }
      );
    }
    console.error('POST /api/catalog/products error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
      { status: 500 }
    );
  }
}
