/**
 * フォーマットユーティリティ
 *
 * 使用例:
 * - 価格表示のフォーマット（商品一覧、カート、注文詳細）
 * - 日時表示のフォーマット（注文日時、更新日時）
 *
 * カスタマイズポイント:
 * - 通貨記号
 * - 日時フォーマットのロケール
 */

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

// （本ファイルはプリミティブ型のみ使用するため、型定義セクションは省略）

// ─────────────────────────────────────────────────────────────────
// 価格フォーマット
// ─────────────────────────────────────────────────────────────────

/**
 * 価格をフォーマットする
 *
 * @param price - フォーマットする価格（数値）
 * @returns フォーマット済み文字列
 *
 * @example
 * ```typescript
 * formatPrice(1000);   // → '¥1,000'
 * formatPrice(0);      // → '無料'
 * formatPrice(-500);   // → '-¥500'
 * ```
 */
export function formatPrice(price: number): string {
  if (price === 0) return '無料';

  const isNegative = price < 0;
  const absFormatted = `¥${Math.abs(price).toLocaleString('ja-JP')}`;

  return isNegative ? `-${absFormatted}` : absFormatted;
}

// ─────────────────────────────────────────────────────────────────
// 日時フォーマット
// ─────────────────────────────────────────────────────────────────

/**
 * 日時を日本語ロケールでフォーマットする
 *
 * @param date - フォーマットする日時（Date オブジェクトまたは ISO 文字列）
 * @returns ja-JP ロケールのフォーマット済み文字列
 *
 * @example
 * ```typescript
 * formatDateTime('2026-02-07T14:30:00');  // → '2026年2月7日 14:30'
 * formatDateTime(new Date());              // → '2026年2月7日 10:00'
 * formatDateTime('invalid');               // → '-'
 * ```
 */
export function formatDateTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '-';

    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(dateObj);
  } catch {
    return '-';
  }
}
