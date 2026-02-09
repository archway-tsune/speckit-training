'use client';

/**
 * ConfirmDialog コンポーネント
 * 確認ダイアログを表示する共通コンポーネント
 *
 * 使用例:
 * - 削除前の確認ダイアログ
 * - 操作の最終確認
 *
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <ConfirmDialog
 *   open={open}
 *   message="この商品をカートから削除しますか？"
 *   confirmLabel="削除する"
 *   variant="danger"
 *   onConfirm={() => { handleDelete(); setOpen(false); }}
 *   onCancel={() => setOpen(false)}
 * />
 * ```
 */
import { useCallback, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export interface ConfirmDialogProps {
  /** ダイアログの表示状態 */
  open: boolean;
  /** ダイアログのタイトル（オプション） */
  title?: string;
  /** 確認メッセージ */
  message: string;
  /** 確認ボタンのラベル */
  confirmLabel?: string;
  /** キャンセルボタンのラベル */
  cancelLabel?: string;
  /** ボタンのスタイルバリアント */
  variant?: 'default' | 'danger';
  /** 確認時のコールバック */
  onConfirm: () => void;
  /** キャンセル時のコールバック */
  onCancel: () => void;
}

// ─────────────────────────────────────────────────────────────────
// スタイル
// ─────────────────────────────────────────────────────────────────

const confirmButtonStyles = {
  default:
    'rounded-md bg-base-900 px-6 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90 focus:outline-none focus:ring-2 focus:ring-base-900 focus:ring-offset-2',
  danger:
    'rounded-md bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2',
};

const cancelButtonStyles =
  'rounded-md border border-base-900/20 px-6 py-2 text-sm font-medium text-base-900 hover:bg-base-100 focus:outline-none focus:ring-2 focus:ring-base-900 focus:ring-offset-2';

// ─────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────

/**
 * 確認ダイアログコンポーネント
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '確認',
  cancelLabel = 'キャンセル',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Escapeキーでダイアログを閉じる
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel],
  );

  // ダイアログ表示時にフォーカスをキャンセルボタンに移動
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      cancelRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      data-testid="confirm-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'confirm-dialog-title' : undefined}
      aria-describedby="confirm-dialog-message"
      onClick={(e) => {
        // オーバーレイクリックで閉じる
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="mx-4 w-full max-w-md rounded-lg bg-white p-8 shadow-xl"
      >
        {title && (
          <h2
            id="confirm-dialog-title"
            className="mb-2 text-lg font-semibold text-base-900"
          >
            {title}
          </h2>
        )}
        <p
          id="confirm-dialog-message"
          className="mb-6 text-center text-base-900/70"
        >
          {message}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            ref={cancelRef}
            data-testid="cancel-button"
            type="button"
            onClick={onCancel}
            className={cancelButtonStyles}
          >
            {cancelLabel}
          </button>
          <button
            data-testid="confirm-button"
            type="button"
            onClick={onConfirm}
            className={confirmButtonStyles[variant]}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
