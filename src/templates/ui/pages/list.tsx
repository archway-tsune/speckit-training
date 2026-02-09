/**
 * ListPage - 一覧画面テンプレート
 * 商品一覧、注文一覧などの一覧表示に使用
 */
import React from 'react';
import { Loading } from '../components/status/Loading';
import { Error } from '../components/status/Error';
import { Empty } from '../components/status/Empty';

export interface ListPageProps<T> {
  /** ページタイトル */
  title: string;
  /** 表示するアイテム配列 */
  items: T[];
  /** アイテムを描画する関数 */
  renderItem?: (item: T, index: number) => React.ReactNode;
  /** ローディング状態 */
  loading?: boolean;
  /** エラーメッセージ */
  error?: string | null;
  /** 空状態のメッセージ */
  emptyMessage?: string;
  /** 空状態のアクションラベル */
  emptyActionLabel?: string;
  /** 空状態のアクション */
  onEmptyAction?: () => void;
  /** エラー時のリトライ */
  onRetry?: () => void;
}

/**
 * 一覧画面テンプレートコンポーネント
 */
export function ListPage<T>({
  title,
  items,
  renderItem,
  loading = false,
  error = null,
  emptyMessage = 'データがありません',
  emptyActionLabel,
  onEmptyAction,
  onRetry,
}: ListPageProps<T>) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-base-900">{title}</h1>
      </div>

      {loading && <Loading message="データを読み込み中..." />}

      {!loading && error && <Error message={error} onRetry={onRetry} />}

      {!loading && !error && items.length === 0 && (
        <Empty
          message={emptyMessage}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      )}

      {!loading && !error && items.length > 0 && renderItem && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => renderItem(item, index))}
        </div>
      )}
    </div>
  );
}
