/**
 * ログアウトAPIテンプレート
 *
 * 使用例:
 * - POST /api/auth/logout
 *
 * カスタマイズポイント:
 * - sessionDestroyer: セッション破棄ロジック
 */
import { NextResponse } from 'next/server';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

/** セッション破棄関数インターフェース */
export interface SessionDestroyer {
  destroySession(): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────
// ハンドラーファクトリ
// ─────────────────────────────────────────────────────────────────

export interface CreateLogoutHandlerOptions {
  sessionDestroyer: SessionDestroyer;
  /** 成功メッセージ */
  successMessage?: string;
  /** サーバーエラーメッセージ */
  serverErrorMessage?: string;
}

/**
 * ログアウトハンドラーを生成
 */
export function createLogoutHandler({
  sessionDestroyer,
  successMessage = 'ログアウトしました',
  serverErrorMessage = 'ログアウトに失敗しました',
}: CreateLogoutHandlerOptions) {
  return async function POST() {
    try {
      await sessionDestroyer.destroySession();
      return NextResponse.json(success({ message: successMessage }));
    } catch (err) {
      console.error('POST /api/auth/logout error:', err);
      return NextResponse.json(
        error(ErrorCode.INTERNAL_ERROR, serverErrorMessage),
        { status: 500 }
      );
    }
  };
}

export default createLogoutHandler;
