/**
 * Pagination コンポーネント
 * ページネーションUI。「全N件中 M〜L件を表示」のテキストと前へ/次へボタンを提供する。
 *
 * 使用例:
 * - 商品一覧のページ切り替え
 * - 注文履歴のページ切り替え
 * - 管理画面のテーブルページ切り替え
 */
'use client';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export interface PaginationProps {
  /** 現在のページ番号（1始まり） */
  page: number;
  /** 1ページあたりの表示件数 */
  limit: number;
  /** 全件数 */
  total: number;
  /** 全ページ数 */
  totalPages: number;
  /** ページ変更時のコールバック */
  onPageChange: (page: number) => void;
}

// ─────────────────────────────────────────────────────────────────
// スタイル
// ─────────────────────────────────────────────────────────────────

const buttonStyles =
  'rounded-md border border-base-900/20 px-4 py-2 text-sm font-medium text-base-900 hover:bg-base-100 disabled:cursor-not-allowed disabled:opacity-50';

// ─────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────

/**
 * ページネーションコンポーネント
 */
export function Pagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (total === 0 || totalPages <= 1) {
    return null;
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <nav aria-label="ページネーション" className="flex items-center justify-between gap-4 py-4">
      <p data-testid="pagination-info" className="text-sm text-base-900/70">
        全{total}件中 {start}〜{end}件を表示
      </p>
      <div className="flex gap-2">
        <button
          data-testid="pagination-prev"
          type="button"
          className={buttonStyles}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="前のページ"
        >
          前へ
        </button>
        <button
          data-testid="pagination-next"
          type="button"
          className={buttonStyles}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="次のページ"
        >
          次へ
        </button>
      </div>
    </nav>
  );
}
