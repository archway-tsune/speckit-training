/**
 * FormPage - フォーム画面テンプレート
 * 登録、編集などのフォーム画面に使用
 */
import React from 'react';

export interface FormPageProps {
  /** ページタイトル */
  title: string;
  /** フォームフィールド */
  children: React.ReactNode;
  /** 送信ハンドラ */
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  /** 送信ボタンのラベル */
  submitLabel?: string;
  /** ローディング状態 */
  loading?: boolean;
  /** キャンセル時のURL */
  cancelUrl?: string;
  /** キャンセルボタンのラベル */
  cancelLabel?: string;
}

/**
 * フォーム画面テンプレートコンポーネント
 */
export function FormPage({
  title,
  children,
  onSubmit,
  submitLabel = '送信',
  loading = false,
  cancelUrl,
  cancelLabel = 'キャンセル',
}: FormPageProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-base-900">{title}</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {children}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-base-900 px-6 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90 focus:outline-none focus:ring-2 focus:ring-base-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '処理中...' : submitLabel}
          </button>

          {cancelUrl && (
            <a
              href={cancelUrl}
              className="rounded-md border border-base-900/20 px-6 py-2 text-sm font-medium text-base-900 hover:bg-base-100"
            >
              {cancelLabel}
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
