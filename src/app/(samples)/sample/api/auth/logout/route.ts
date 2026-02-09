/**
 * ログアウトAPI
 */
import { NextRequest, NextResponse } from 'next/server';
import { destroyServerSession } from '@/infrastructure/auth';

export async function POST(request: NextRequest) {
  await destroyServerSession();
  const url = new URL('/sample/catalog', request.url);
  return NextResponse.redirect(url);
}

// GETリクエストへの対応（リダイレクト）
export async function GET(request: NextRequest) {
  await destroyServerSession();
  const url = new URL('/sample/catalog', request.url);
  return NextResponse.redirect(url);
}
