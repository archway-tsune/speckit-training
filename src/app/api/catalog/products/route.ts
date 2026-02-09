/**
 * カタログ商品一覧API（読み取り専用）
 * GET /api/catalog/products — 購入者向け商品一覧
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProducts, NotFoundError } from '@/domains/catalog/api';
import { productRepository } from '@/infrastructure/repositories';
import { getServerSession } from '@/infrastructure/auth';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';

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
    console.error('GET /api/catalog/products error:', err);
    return NextResponse.json(
      error(ErrorCode.INTERNAL_ERROR, 'システムエラーが発生しました'),
      { status: 500 }
    );
  }
}
