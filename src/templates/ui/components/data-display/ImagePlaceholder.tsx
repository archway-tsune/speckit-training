/**
 * ImagePlaceholder コンポーネント
 * 画像がない場合にSVGアイコンのプレースホルダーを表示する。画像URLがあれば画像を表示。
 *
 * 使用例:
 * - 商品カードの画像表示
 * - 商品詳細の画像表示
 * - カートアイテムのサムネイル
 */

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export interface ImagePlaceholderProps {
  /** 画像URL（未指定の場合プレースホルダーを表示） */
  src?: string;
  /** 代替テキスト */
  alt: string;
  /** 追加のCSSクラス */
  className?: string;
  /** サイズバリアント */
  size?: 'sm' | 'md' | 'lg';
}

// ─────────────────────────────────────────────────────────────────
// スタイル
// ─────────────────────────────────────────────────────────────────

const sizeClasses: Record<string, string> = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-64 h-64',
};

// ─────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────

/**
 * 画像プレースホルダーコンポーネント
 */
export function ImagePlaceholder({
  src,
  alt,
  className = '',
  size = 'md',
}: ImagePlaceholderProps) {
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} rounded-md object-cover ${className}`}
      />
    );
  }

  return (
    <div
      data-testid="image-placeholder"
      className={`${sizeClass} flex items-center justify-center rounded-md bg-base-100 ${className}`}
      aria-label={alt}
    >
      <svg
        className="h-1/3 w-1/3 text-base-900/30"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
        />
      </svg>
    </div>
  );
}
