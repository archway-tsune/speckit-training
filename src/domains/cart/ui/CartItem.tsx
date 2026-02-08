'use client';

/**
 * CartItem コンポーネント
 * カートアイテム行 — 商品画像・名前・単価・数量・小計を表示
 */
import React from 'react';
import type { CartItem as CartItemType } from '@/contracts/cart';
import { ImagePlaceholder } from '@/templates/ui/components/data-display/ImagePlaceholder';
import { QuantitySelector } from '@/templates/ui/components/form/QuantitySelector';

export interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemove?: (productId: string) => void;
  error?: string;
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  error,
}: CartItemProps) {
  return (
    <div data-testid="cart-item" className="flex items-center gap-4 border-b border-base-900/10 py-4">
      {/* 商品画像 */}
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.productName}
          className="h-20 w-20 rounded-md object-cover"
        />
      ) : (
        <ImagePlaceholder alt={item.productName} size="sm" />
      )}

      {/* 商品情報 */}
      <div className="flex-1">
        <h3 className="font-medium text-base-900">{item.productName}</h3>
        <p className="text-base-900/60">{formatPrice(item.price)}</p>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* 数量 */}
      <div className="flex items-center gap-2">
        {onUpdateQuantity ? (
          <QuantitySelector
            value={item.quantity}
            min={1}
            max={99}
            onChange={(newQty) => onUpdateQuantity(item.productId, newQty)}
          />
        ) : (
          <span data-testid="cart-item-quantity" className="text-base-900">{item.quantity}</span>
        )}
      </div>

      {/* 小計 */}
      <div className="w-24 text-right">
        <p data-testid="cart-item-subtotal" className="font-bold text-base-900">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>

      {/* 削除ボタン */}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.productId)}
          className="rounded-md p-2 text-base-900/60 hover:bg-base-100 hover:text-base-900"
          aria-label={`${item.productName}を削除`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
