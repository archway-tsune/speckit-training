'use client';

/**
 * CartView コンポーネント（本番実装）
 * カート表示 — Loading/Error/Empty 状態対応
 */
import React, { useState } from 'react';
import type { Cart } from '@/contracts/cart';
import { Loading } from '@/templates/ui/components/status/Loading';
import { Error } from '@/templates/ui/components/status/Error';
import { ConfirmDialog } from '@/templates/ui/components/dialog/ConfirmDialog';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';

export interface CartViewProps {
  cart: Cart | null;
  isLoading: boolean;
  error?: string;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemove?: (productId: string) => void;
}

export function CartView({
  cart,
  isLoading,
  error,
  onUpdateQuantity,
  onRemove,
}: CartViewProps) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  if (isLoading) {
    return <Loading message="カートを読み込み中..." />;
  }

  if (error) {
    return <Error message={error} />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-base-900/70">カートに商品がありません</p>
        <a
          href="/catalog"
          className="rounded-md bg-base-900 px-6 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90"
        >
          商品一覧を見る
        </a>
      </div>
    );
  }

  const handleRemoveClick = (productId: string) => {
    setDeleteTargetId(productId);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId && onRemove) {
      onRemove(deleteTargetId);
    }
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setDeleteTargetId(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-lg border border-base-900/10 bg-white p-6">
        {cart.items.map((item) => (
          <CartItem
            key={item.productId}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove ? handleRemoveClick : undefined}
          />
        ))}

        <CartSummary subtotal={cart.subtotal} />
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        message="この商品をカートから削除しますか？"
        confirmLabel="削除する"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
