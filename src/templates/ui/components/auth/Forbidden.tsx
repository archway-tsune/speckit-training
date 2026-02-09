/**
 * Forbidden コンポーネント
 * 権限不足時の表示コンポーネント
 */
import React from 'react';

export interface ForbiddenProps {
  /** タイトル */
  title?: string;
  /** 表示するメッセージ */
  message?: string;
  /** リダイレクト先URL */
  redirectUrl?: string;
  /** リダイレクトリンクのラベル */
  redirectLabel?: string;
}

/**
 * 権限不足表示コンポーネント
 */
export function Forbidden({
  title,
  message = 'アクセス権限がありません',
  redirectUrl,
  redirectLabel = 'ホームに戻る',
}: ForbiddenProps) {
  return (
    <div
      role="alert"
      aria-label="権限エラー"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center"
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100"
        aria-hidden="true"
      >
        <svg
          className="h-8 w-8 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      </div>
      {title && <h1 className="text-2xl font-bold text-base-900">{title}</h1>}
      <p className="text-base-900/70">{message}</p>
      {redirectUrl && (
        <a
          href={redirectUrl}
          className="rounded-md bg-base-900 px-6 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90 focus:outline-none focus:ring-2 focus:ring-base-900 focus:ring-offset-2"
        >
          {redirectLabel}
        </a>
      )}
    </div>
  );
}
