/**
 * DetailPage - 詳細画面テンプレート
 * 商品詳細、注文詳細などの詳細表示に使用
 */
import React from 'react';
import { Loading } from '../components/status/Loading';
import { Error } from '../components/status/Error';

export interface DetailPageProps {
  /** ページタイトル */
  title: string;
  /** ページコンテンツ */
  children: React.ReactNode;
  /** ローディング状態 */
  loading?: boolean;
  /** エラーメッセージ */
  error?: string | null;
  /** 戻るリンクのURL */
  backUrl?: string;
  /** 戻るリンクのラベル */
  backLabel?: string;
  /** エラー時のリトライ */
  onRetry?: () => void;
}

/**
 * 詳細画面テンプレートコンポーネント
 */
export function DetailPage({
  title,
  children,
  loading = false,
  error = null,
  backUrl,
  backLabel = '戻る',
  onRetry,
}: DetailPageProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ヘッダー */}
      <div className="mb-8 flex items-center gap-4">
        {backUrl && (
          <a
            href={backUrl}
            className="flex items-center gap-1 text-sm text-base-900/70 hover:text-base-900"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {backLabel}
          </a>
        )}
        <h1 className="text-2xl font-bold text-base-900">{title}</h1>
      </div>

      {/* コンテンツ */}
      {loading && <Loading message="データを読み込み中..." />}

      {!loading && error && <Error message={error} onRetry={onRetry} />}

      {!loading && !error && <div className="space-y-6">{children}</div>}
    </div>
  );
}
