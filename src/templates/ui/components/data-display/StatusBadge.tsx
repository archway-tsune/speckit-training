/**
 * StatusBadge コンポーネント
 * ステータスに応じた色付きバッジ。rounded-fullのピル型で、ステータスごとに背景色・文字色が変わる。
 *
 * 使用例:
 * - 注文一覧のステータス表示
 * - 注文詳細のステータス表示
 */

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export interface StatusBadgeProps {
  /** ステータス値 */
  status: string;
  /** ステータスごとのTailwind CSSカラークラス */
  statusColors: Record<string, string>;
  /** ステータスごとの表示ラベル */
  statusLabels: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────
// スタイル
// ─────────────────────────────────────────────────────────────────

const defaultColors = 'bg-base-100 text-base-900';

// ─────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────

/**
 * ステータスバッジコンポーネント
 */
export function StatusBadge({
  status,
  statusColors,
  statusLabels,
}: StatusBadgeProps) {
  const colorClass = statusColors[status] ?? defaultColors;
  const label = statusLabels[status] ?? status;

  return (
    <span
      data-testid="status-badge"
      role="status"
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}
