/**
 * セッション確認APIテンプレート
 *
 * 使用例:
 * - GET /api/auth/session
 *
 * カスタマイズポイント:
 * - sessionGetter: セッション取得ロジック
 * - responseShape: レスポンスデータ形状
 */
import { NextResponse } from 'next/server';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

/** セッションデータ */
export interface SessionData {
  userId: string;
  role: string;
  name: string;
}

/** セッション取得関数インターフェース */
export interface SessionGetter {
  getSession(): Promise<SessionData | null>;
}

// ─────────────────────────────────────────────────────────────────
// ハンドラーファクトリ
// ─────────────────────────────────────────────────────────────────

export interface CreateSessionHandlerOptions {
  sessionGetter: SessionGetter;
  /** 未認証エラーメッセージ */
  unauthorizedMessage?: string;
  /** サーバーエラーメッセージ */
  serverErrorMessage?: string;
}

/**
 * セッション確認ハンドラーを生成
 */
export function createSessionHandler({
  sessionGetter,
  unauthorizedMessage = '未認証',
  serverErrorMessage = 'セッション確認に失敗しました',
}: CreateSessionHandlerOptions) {
  return async function GET() {
    try {
      const session = await sessionGetter.getSession();

      if (!session) {
        return NextResponse.json(
          error(ErrorCode.UNAUTHORIZED, unauthorizedMessage),
          { status: 401 }
        );
      }

      return NextResponse.json(
        success({
          userId: session.userId,
          role: session.role,
          name: session.name,
        })
      );
    } catch (err) {
      console.error('GET /api/auth/session error:', err);
      return NextResponse.json(
        error(ErrorCode.INTERNAL_ERROR, serverErrorMessage),
        { status: 500 }
      );
    }
  };
}

export default createSessionHandler;
