/**
 * QuantitySelector コンポーネント
 * 数量選択の+-ステッパー。min/maxバリデーション付き。
 *
 * 使用例:
 * - カートアイテムの数量変更
 * - 商品詳細での数量指定
 */
'use client';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export interface QuantitySelectorProps {
  /** 現在の数量 */
  value: number;
  /** 最小値 */
  min: number;
  /** 最大値 */
  max: number;
  /** 数量変更時のコールバック */
  onChange: (value: number) => void;
  /** 無効化フラグ */
  disabled?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// スタイル
// ─────────────────────────────────────────────────────────────────

const buttonStyles =
  'flex h-8 w-8 items-center justify-center rounded-md border border-base-900/20 text-base-900 hover:bg-base-100 disabled:cursor-not-allowed disabled:opacity-50';

// ─────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────

/**
 * 数量セレクターコンポーネント
 */
export function QuantitySelector({
  value,
  min,
  max,
  onChange,
  disabled = false,
}: QuantitySelectorProps) {
  const isInvalid = min > max;
  const canDecrement = !disabled && !isInvalid && value > min;
  const canIncrement = !disabled && !isInvalid && value < max;

  return (
    <div className="flex items-center gap-2">
      <button
        data-testid="quantity-decrement"
        type="button"
        className={buttonStyles}
        disabled={!canDecrement}
        onClick={() => onChange(value - 1)}
        aria-label="数量を減らす"
      >
        −
      </button>
      <span
        data-testid="quantity-value"
        className="min-w-[2rem] text-center text-sm font-medium text-base-900"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        data-testid="quantity-increment"
        type="button"
        className={buttonStyles}
        disabled={!canIncrement}
        onClick={() => onChange(value + 1)}
        aria-label="数量を増やす"
      >
        +
      </button>
    </div>
  );
}
