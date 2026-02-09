'use client';

/**
 * ProductList コンポーネント
 * 商品一覧表示（検索・ページネーション統合）
 */
import React from 'react';
import type { Product } from '@/contracts/catalog';
import { Loading } from '@/templates/ui/components/status/Loading';
import { Error } from '@/templates/ui/components/status/Error';
import { Empty } from '@/templates/ui/components/status/Empty';
import { SearchBar } from '@/templates/ui/components/form/SearchBar';
import { ProductCard } from './ProductCard';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  error?: string;
  pagination: Pagination | null;
  onRetry?: () => void;
  onPageChange?: (page: number) => void;
  onSearch?: (keyword: string) => void;
}

export function ProductList({
  products,
  isLoading,
  error,
  pagination,
  onRetry,
  onPageChange,
  onSearch,
}: ProductListProps) {
  // コンテンツ部分を決定
  const renderContent = () => {
    // ローディング状態
    if (isLoading) {
      return <Loading message="商品を読み込み中..." />;
    }

    // エラー状態
    if (error) {
      return <Error message={error} onRetry={onRetry} />;
    }

    // 空状態
    if (products.length === 0) {
      return <Empty message="商品がありません" />;
    }

    return (
      <>
        {/* 商品グリッド */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* ページネーション */}
        {pagination && (
          <div className="mt-8 flex items-center justify-between border-t border-base-900/10 pt-4">
            <p className="text-sm text-base-900/70">
              全{pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1}〜
              {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="rounded-md border border-base-900/20 px-4 py-2 text-sm font-medium text-base-900 hover:bg-base-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                前へ
              </button>
              <button
                type="button"
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-md border border-base-900/20 px-4 py-2 text-sm font-medium text-base-900 hover:bg-base-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                次へ
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div>
      {onSearch && (
        <div className="mb-6">
          <SearchBar onSearch={onSearch} placeholder="商品を検索..." />
        </div>
      )}
      {renderContent()}
    </div>
  );
}
