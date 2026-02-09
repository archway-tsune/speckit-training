'use client';

/**
 * ProductDetail コンポーネント
 * 商品詳細表示（在庫数・カートボタン制御）
 */
import React from 'react';
import type { Product } from '@/contracts/catalog';
import { Loading } from '@/templates/ui/components/status/Loading';
import { Error } from '@/templates/ui/components/status/Error';

export interface ProductDetailProps {
  product: Product | null;
  isLoading: boolean;
  error?: string;
  onAddToCart?: (productId: string) => void;
  isAddingToCart?: boolean;
  onBack?: () => void;
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

export function ProductDetail({
  product,
  isLoading,
  error,
  onAddToCart,
  isAddingToCart = false,
  onBack,
}: ProductDetailProps) {
  if (isLoading) {
    return <Loading message="商品情報を読み込み中..." />;
  }

  if (error) {
    return <Error message={error} />;
  }

  if (!product) {
    return <Error message="商品が見つかりません" />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm text-base-900/70 hover:text-base-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          戻る
        </button>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ) : (
            <div
              data-testid="product-image-placeholder"
              className="flex aspect-square w-full items-center justify-center rounded-lg bg-base-100"
            >
              <svg
                className="h-24 w-24 text-base-900/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-base-900">{product.name}</h1>
          <p className="mt-4 text-3xl font-bold text-base-900">{formatPrice(product.price)}</p>

          <div className="mt-4">
            <span className="text-sm text-base-900/60">
              在庫数: {product.stock}
            </span>
          </div>

          {product.description && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-base-900/60">商品説明</h2>
              <p className="mt-2 text-base-900/80">{product.description}</p>
            </div>
          )}

          {onAddToCart && (
            <button
              type="button"
              onClick={() => onAddToCart(product.id)}
              disabled={product.stock === 0 || isAddingToCart}
              className="mt-8 w-full rounded-md bg-base-900 px-6 py-3 text-base font-medium text-base-50 hover:bg-base-900/90 focus:outline-none focus:ring-2 focus:ring-base-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAddingToCart ? '追加中...' : 'カートに追加'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
