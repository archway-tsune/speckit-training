'use client';

/**
 * Cart ドメイン - UI 本番実装
 * カート表示・操作（データフェッチ内蔵）
 */
import React, { useState, useEffect, useCallback } from 'react';
import type { Cart, CartItem } from '@/contracts/cart';
import { Loading } from '@/templates/ui/components/status/Loading';
import { Error as ErrorDisplay } from '@/templates/ui/components/status/Error';
import Link from 'next/link';
import { ConfirmDialog } from '@/templates/ui/components/dialog/ConfirmDialog';

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  quantityError,
}: {
  item: CartItem;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemove?: (productId: string) => void;
  quantityError?: string;
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* 商品情報 */}
      <div className="flex-1">
        <h3 className="font-medium text-base-900">{item.productName}</h3>
        <p className="text-sm text-base-900/60">{formatPrice(item.price)}</p>
        {quantityError && (
          <p className="mt-1 text-sm text-red-600" role="alert">{quantityError}</p>
        )}
      </div>

      {/* 数量 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onUpdateQuantity?.(item.productId, item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-base-900/20 text-base-900 hover:bg-base-100 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`${item.productName}の数量を減らす`}
        >
          −
        </button>
        <span
          className="flex h-8 w-10 items-center justify-center text-center text-base-900"
          aria-label={`${item.productName}の数量`}
        >
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onUpdateQuantity?.(item.productId, item.quantity + 1)}
          disabled={item.quantity >= 99}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-base-900/20 text-base-900 hover:bg-base-100 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`${item.productName}の数量を増やす`}
        >
          +
        </button>
      </div>

      {/* 小計 */}
      <div className="w-24 text-right">
        <p data-testid="item-subtotal" className="font-bold text-base-900">
          {formatPrice(item.price * item.quantity)}
        </p>
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

export function CartView() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [quantityErrors, setQuantityErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ productId: string; productName: string } | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart');
      if (!res.ok) {
        throw new Error('カートの取得に失敗しました');
      }
      const json = await res.json();
      if (json.success) {
        setCart(json.data);
      } else {
        throw new Error('カートの取得に失敗しました');
      }
    } catch {
      setError('カートの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = useCallback(async (productId: string, quantity: number) => {
    setQuantityErrors((prev) => ({ ...prev, [productId]: '' }));

    try {
      const res = await fetch(`/api/cart/items/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) {
        const json = await res.json();
        if (json.details) {
          const fieldError = json.details.find(
            (d: { field: string; message: string }) => d.field === 'quantity'
          );
          if (fieldError) {
            setQuantityErrors((prev) => ({ ...prev, [productId]: fieldError.message }));
            return;
          }
        }
        setQuantityErrors((prev) => ({ ...prev, [productId]: json.message || '更新に失敗しました' }));
        return;
      }

      const json = await res.json();
      if (json.success) {
        setCart(json.data);
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch {
      setQuantityErrors((prev) => ({ ...prev, [productId]: '更新に失敗しました' }));
    }
  }, []);

  const handleRemoveClick = useCallback((productId: string) => {
    const item = cart?.items.find((i) => i.productId === productId);
    setDeleteTarget({ productId, productName: item?.productName ?? '' });
  }, [cart]);

  const confirmRemove = useCallback(async () => {
    if (!deleteTarget) return;
    const { productId } = deleteTarget;
    setDeleteTarget(null);

    try {
      const res = await fetch(`/api/cart/items/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        return;
      }

      const json = await res.json();
      if (json.success) {
        setCart(json.data);
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch {
      // エラー時は何もしない
    }
  }, [deleteTarget]);

  // ローディング状態
  if (isLoading) {
    return <Loading message="カートを読み込み中..." />;
  }

  // エラー状態
  if (error) {
    return <ErrorDisplay message={error} />;
  }

  // 空状態
  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-base-900/60">カートに商品がありません</p>
        <Link
          href="/catalog"
          className="rounded-md bg-base-900 px-6 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90"
        >
          商品一覧を見る
        </Link>
      </div>
    );
  }

  const tax = Math.floor(cart.subtotal * 0.1);
  const total = cart.subtotal + tax;

  return (
    <div className="mx-auto max-w-4xl">
      {/* カートアイテム */}
      <div className="rounded-lg border border-base-900/10 bg-white p-6">
        {cart.items.map((item) => (
          <CartItemRow
            key={item.productId}
            item={item}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveClick}
            quantityError={quantityErrors[item.productId]}
          />
        ))}

        {/* 金額明細 */}
        <div className="mt-6 border-t border-base-900/10 pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-base-900/60">商品数: {cart.itemCount}点</p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <p className="text-sm text-base-900/60">商品合計</p>
              <p data-testid="cart-subtotal" className="font-bold text-base-900">
                {formatPrice(cart.subtotal)}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm text-base-900/60">消費税（10%）</p>
              <p data-testid="cart-tax" className="text-base-900">
                {formatPrice(tax)}
              </p>
            </div>
            <div className="flex justify-between border-t border-base-900/10 pt-2">
              <p className="font-bold text-base-900">総合計</p>
              <p data-testid="cart-total" className="text-2xl font-bold text-base-900">
                {formatPrice(total)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`「${deleteTarget?.productName ?? ''}」をカートから削除しますか？`}
        confirmLabel="削除する"
        variant="danger"
        onConfirm={confirmRemove}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
