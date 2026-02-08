/**
 * ログアウトページテンプレート
 *
 * 使用例:
 * - 一般ユーザー用ログアウトページ
 * - 管理者用ログアウトページ
 *
 * カスタマイズポイント:
 * - title: ページタイトル
 * - logoutEndpoint: ログアウトAPIのエンドポイント
 * - redirectUrl: ログアウト成功後のリダイレクト先
 * - message: ログアウト完了メッセージ
 */
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export interface LogoutPageProps {
  /** ページタイトル */
  title?: string;
  /** ログアウトAPIエンドポイント */
  logoutEndpoint?: string;
  /** ログアウト成功後のリダイレクト先 */
  redirectUrl?: string;
  /** ログアウト完了メッセージ */
  message?: string;
  /** 処理中メッセージ */
  loadingMessage?: string;
  /** エラーメッセージ */
  errorMessage?: string;
  /** リダイレクト前の待機時間（ミリ秒） */
  redirectDelay?: number;
}

// ─────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────

/**
 * 汎用ログアウトページコンポーネント
 */
export function LogoutPage({
  title = 'ログアウト',
  logoutEndpoint = '/api/auth/logout',
  redirectUrl = '/',
  message = 'ログアウトしました',
  loadingMessage = 'ログアウト中...',
  errorMessage = 'ログアウトに失敗しました',
  redirectDelay = 1500,
}: LogoutPageProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const hasRun = useRef(false);

  useEffect(() => {
    const doLogout = async () => {
      if (hasRun.current) return;
      hasRun.current = true;

      try {
        const res = await fetch(logoutEndpoint, { method: 'POST' });
        if (res.ok) {
          setStatus('success');
          // 一定時間後にリダイレクト
          setTimeout(() => {
            router.push(redirectUrl);
            router.refresh();
          }, redirectDelay);
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
      }
    };

    doLogout();
  }, [logoutEndpoint, redirectUrl, redirectDelay, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-50 px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-8 text-3xl font-bold text-base-900">{title}</h1>

        <div className="rounded-lg border border-base-900/10 bg-white p-8">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-base-900 border-t-transparent" />
              <p className="text-base-900/60">{loadingMessage}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-base-900">{message}</p>
              <p className="text-sm text-base-900/60">リダイレクト中...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-red-600">{errorMessage}</p>
              <button
                onClick={() => {
                  hasRun.current = false;
                  setStatus('loading');
                }}
                className="mt-2 text-sm text-base-900 underline hover:no-underline"
              >
                再試行
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LogoutPage;
