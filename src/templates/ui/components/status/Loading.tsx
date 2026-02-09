/**
 * Loading コンポーネント
 * ローディング状態を表示する共通コンポーネント
 */
import React from 'react';

export interface LoadingProps {
  /** 表示するメッセージ */
  message?: string;
  /** スピナーのサイズ */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

/**
 * ローディング表示コンポーネント
 */
export function Loading({ message = '読み込み中...', size = 'md' }: LoadingProps) {
  return (
    <div
      role="status"
      aria-label="読み込み中"
      className="flex flex-col items-center justify-center gap-4 p-8"
    >
      <div
        data-testid="loading-spinner"
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-base-900 border-t-transparent`}
        aria-hidden="true"
      />
      <p className="text-base-900/70 text-sm">{message}</p>
    </div>
  );
}
