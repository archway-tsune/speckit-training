'use client';

/**
 * ProductCard コンポーネント
 * 商品カード表示（在庫状況対応）
 */
import React from 'react';
import Link from 'next/link';
import type { Product } from '@/contracts/catalog';

export interface ProductCardProps {
  product: Product;
  basePath?: string;
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

export function ProductCard({ product, basePath = '' }: ProductCardProps) {
  return (
    <div className="rounded-lg border border-base-900/10 bg-white p-4 shadow-sm">
      <Link href={`${basePath}/catalog/${product.id}`} data-testid="product-card" className="block">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="mb-4 aspect-square w-full rounded-md object-cover"
          />
        ) : (
          <div
            data-testid="product-image-placeholder"
            className="mb-4 flex aspect-square w-full items-center justify-center rounded-md bg-base-100"
          >
            <svg
              className="h-12 w-12 text-base-900/20"
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
        <h3 className="text-lg font-semibold text-base-900">{product.name}</h3>
        <p className="mt-2 text-xl font-bold text-base-900">{formatPrice(product.price)}</p>
        {product.stock === 0 && (
          <span className="mt-2 inline-block rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
            在庫切れ
          </span>
        )}
      </Link>
    </div>
  );
}
