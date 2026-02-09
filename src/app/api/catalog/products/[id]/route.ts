/**
 * カタログ商品詳細API（読み取り専用）
 * GET /api/catalog/products/:id — 購入者向け商品詳細
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProductById, NotFoundError } from '@/domains/catalog/api';
import { productRepository } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';

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
