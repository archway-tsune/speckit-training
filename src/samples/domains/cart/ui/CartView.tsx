'use client';

/**
 * CartView コンポーネント
 * カート表示・操作
 */
import React from 'react';
import type { Cart, CartItem } from '@/contracts/cart';
import { Loading } from '@/templates/ui/components/status/Loading';
import { Error } from '@/templates/ui/components/status/Error';
import { Empty } from '@/templates/ui/components/status/Empty';

export interface CartViewProps {
  cart: Cart | null;
  isLoading: boolean;
  error?: string;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemove?: (productId: string) => void;
  onCheckout?: () => void;
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemove?: (productId: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-base-900/10 py-4">
      {/* 商品画像 */}
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.productName}
          className="h-20 w-20 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-md bg-base-100">
          <svg
            className="h-8 w-8 text-base-900/20"
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

      {/* 商品情報 */}
      <div className="flex-1">
        <h3 className="font-medium text-base-900">{item.productName}</h3>
        <p className="text-lg font-bold text-base-900">{formatPrice(item.price)}</p>
      </div>

      {/* 数量 */}
      <div className="flex items-center gap-2">
        <label htmlFor={`quantity-${item.productId}`} className="sr-only">
          数量
        </label>
        <select
          id={`quantity-${item.productId}`}
          value={item.quantity}
          onChange={(e) => onUpdateQuantity?.(item.productId, Number(e.target.value))}
          className="rounded-md border border-base-900/20 px-3 py-1 text-base-900"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* 小計 */}
      <div className="w-24 text-right">
        <p className="font-bold text-base-900">{formatPrice(item.price * item.quantity)}</p>
      </div>

      {/* 削除ボタン */}
      <button
        type="button"
        onClick={() => onRemove?.(item.productId)}
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
    </div>
  );
}

export function CartView({
  cart,
  isLoading,
  error,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: CartViewProps) {
  // ローディング状態
  if (isLoading) {
    return <Loading message="カートを読み込み中..." />;
  }

  // エラー状態
  if (error) {
    return <Error message={error} />;
  }

  // 空状態
  if (!cart || cart.items.length === 0) {
    return <Empty message="カートは空です" actionLabel="買い物を続ける" />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* カートアイテム */}
      <div className="rounded-lg border border-base-900/10 bg-white p-6">
        {cart.items.map((item) => (
          <CartItemRow
            key={item.productId}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
          />
        ))}

        {/* 合計 */}
        <div className="mt-6 flex items-center justify-between border-t border-base-900/10 pt-6">
          <div>
            <p className="text-sm text-base-900/60">商品数: {cart.itemCount}点</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-base-900/60">小計</p>
            <p data-testid="cart-subtotal" className="text-2xl font-bold text-base-900">{formatPrice(cart.subtotal)}</p>
          </div>
        </div>

        {/* 注文ボタン */}
        {onCheckout && (
          <button
            type="button"
            onClick={onCheckout}
            className="mt-6 w-full rounded-md bg-base-900 px-6 py-3 text-base font-medium text-base-50 hover:bg-base-900/90 focus:outline-none focus:ring-2 focus:ring-base-900 focus:ring-offset-2"
          >
            注文手続きへ
          </button>
        )}
      </div>
    </div>
  );
}
