/**
 * 商品管理API - 一覧・登録
 * GET /api/products — 商品一覧取得（管理者用）
 * POST /api/products — 商品登録
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct, ForbiddenError } from '@/domains/product/api';
import { productRepository } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';
import { ValidationError } from '@/foundation/validation/runtime';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        error(ErrorCode.UNAUTHORIZED, 'ログインが必要です'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const input = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || undefined,
    };

    const result = await getProducts(input, {
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
    console.error('GET /api/products error:', err);
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
    console.error('POST /api/products error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
      { status: 500 }
    );
  }
}
