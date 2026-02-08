/**
 * SearchBar コンポーネント
 * 検索入力フィールド。Enterキーで検索実行、クリアボタン付き。
 *
 * 使用例:
 * - 商品一覧の検索バー
 * - 管理画面の検索フィルター
 */
'use client';

import { useState, type KeyboardEvent } from 'react';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export interface SearchBarProps {
  /** 検索実行時のコールバック */
  onSearch: (query: string) => void;
  /** 初期値 */
  defaultValue?: string;
  /** プレースホルダーテキスト */
  placeholder?: string;
}

// ─────────────────────────────────────────────────────────────────
// スタイル
// ─────────────────────────────────────────────────────────────────

const inputStyles =
  'w-full rounded-md border border-base-900/20 px-4 py-2 pr-10 text-base-900 focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900';

// ─────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────

/**
 * 検索バーコンポーネント
 */
export function SearchBar({
  onSearch,
  defaultValue = '',
  placeholder = '検索...',
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div role="search" className="relative w-full">
      <input
        data-testid="search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputStyles}
        aria-label="検索"
      />
      {query && (
        <button
          data-testid="search-clear"
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-base-900/50 hover:text-base-900"
          aria-label="検索をクリア"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
