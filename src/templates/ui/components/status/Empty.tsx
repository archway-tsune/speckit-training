'use client';

/**
 * Empty コンポーネント
 * 空状態を表示する共通コンポーネント
 */
import React from 'react';

export interface EmptyProps {
  /** 表示するメッセージ */
  message?: string;
  /** アクションボタンのラベル */
  actionLabel?: string;
  /** アクション時のコールバック */
  onAction?: () => void;
}

/**
 * 空状態表示コンポーネント
 */
export function Empty({
  message = 'データがありません',
  actionLabel,
  onAction,
}: EmptyProps) {
  return (
    <div
      role="status"
      aria-label="データなし"
      className="flex flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-base-100"
        aria-hidden="true"
      >
        <svg
          className="h-6 w-6 text-base-900/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="text-base-900/70">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-md bg-base-900 px-4 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90 focus:outline-none focus:ring-2 focus:ring-base-900 focus:ring-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
