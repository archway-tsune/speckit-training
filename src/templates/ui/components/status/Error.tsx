'use client';

/**
 * Error コンポーネント
 * エラー状態を表示する共通コンポーネント
 */
import React from 'react';

export interface ErrorProps {
  /** エラーメッセージ */
  message: string;
  /** エラータイトル（オプション） */
  title?: string;
  /** リトライ時のコールバック */
  onRetry?: () => void;
}

/**
 * エラー表示コンポーネント
 */
export function Error({ message, title, onRetry }: ErrorProps) {
  return (
    <div
      role="alert"
      aria-label="エラー"
      className="flex flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100"
        aria-hidden="true"
      >
        <svg
          className="h-6 w-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      {title && <h3 className="text-lg font-semibold text-base-900">{title}</h3>}
      <p className="text-base-900/70">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-base-900 px-4 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90 focus:outline-none focus:ring-2 focus:ring-base-900 focus:ring-offset-2"
        >
          再試行
        </button>
      )}
    </div>
  );
}
