/**
 * テスト用リセットAPI
 * E2Eテスト実行時に状態をリセットするためのエンドポイント
 * 本番環境では使用しないこと
 */
import { NextResponse } from 'next/server';
import { resetAllStores } from '@/infrastructure/repositories/reset';

export async function POST() {
  // 開発環境のみ有効
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    resetAllStores();
    return NextResponse.json({ success: true, message: 'All stores reset' });
  } catch (err) {
    console.error('Test reset error:', err);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}
