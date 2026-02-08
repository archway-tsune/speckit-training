/**
 * フォームフィールドコンポーネント
 *
 * 使用例:
 * - 入力フォームのラベル付きフィールド
 * - エラー表示付きのフォーム入力
 */
import { type InputHTMLAttributes, type ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export interface FormFieldProps {
  /** フィールドID */
  id: string;
  /** ラベルテキスト */
  label: string;
  /** エラーメッセージ */
  error?: string;
  /** 必須マーク表示 */
  required?: boolean;
  /** ヒントテキスト */
  hint?: string;
  /** 子要素（カスタム入力コンポーネント） */
  children?: ReactNode;
}

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}

export interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  rows?: number;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

// ─────────────────────────────────────────────────────────────────
// スタイル
// ─────────────────────────────────────────────────────────────────

const baseInputStyles =
  'w-full rounded-md border border-base-900/20 px-4 py-2 text-base-900 focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900';

const errorInputStyles =
  'w-full rounded-md border border-red-500 px-4 py-2 text-base-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';

// ─────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────

/**
 * フォームフィールドラッパー
 */
export function FormField({
  id,
  label,
  error,
  required,
  hint,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-base-900">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-sm text-base-900/60">{hint}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

/**
 * テキスト入力フィールド
 */
export function TextInput({
  id,
  label,
  error,
  hint,
  required,
  className,
  ...props
}: TextInputProps) {
  return (
    <FormField id={id} label={label} error={error} required={required} hint={hint}>
      <input
        id={id}
        name={id}
        className={`${error ? errorInputStyles : baseInputStyles} ${className || ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        required={required}
        {...props}
      />
    </FormField>
  );
}

/**
 * テキストエリアフィールド
 */
export function TextArea({
  id,
  label,
  error,
  hint,
  required,
  rows = 4,
  className,
  ...props
}: TextAreaProps) {
  return (
    <FormField id={id} label={label} error={error} required={required} hint={hint}>
      <textarea
        id={id}
        name={id}
        rows={rows}
        className={`${error ? errorInputStyles : baseInputStyles} ${className || ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        required={required}
        {...props}
      />
    </FormField>
  );
}

/**
 * セレクトフィールド
 */
export function Select({
  id,
  label,
  error,
  hint,
  required,
  options,
  placeholder,
  className,
  ...props
}: SelectProps) {
  return (
    <FormField id={id} label={label} error={error} required={required} hint={hint}>
      <select
        id={id}
        name={id}
        className={`${error ? errorInputStyles : baseInputStyles} ${className || ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        required={required}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

export default { FormField, TextInput, TextArea, Select };
