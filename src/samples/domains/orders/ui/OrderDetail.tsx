'use client';

/**
 * OrderDetail コンポーネント
 * 注文詳細表示
 */
import React from 'react';
import type { Order } from '@/contracts/orders';
import { Loading } from '@/templates/ui/components/status/Loading';
import { Error } from '@/templates/ui/components/status/Error';

export interface OrderDetailProps {
  order: Order | null;
  isLoading: boolean;
  error?: string;
  onBack?: () => void;
}

const statusLabels: Record<Order['status'], string> = {
  pending: '処理待ち',
  confirmed: '確定済み',
  shipped: '発送済み',
  delivered: '配達完了',
  cancelled: 'キャンセル',
};

const statusColors: Record<Order['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function OrderDetail({
  order,
  isLoading,
  error,
  onBack,
}: OrderDetailProps) {
  // ローディング状態
  if (isLoading) {
    return <Loading message="注文情報を読み込み中..." />;
  }

  // エラー状態
  if (error) {
    return <Error message={error} />;
  }

  // データなし
  if (!order) {
    return <Error message="注文が見つかりません" />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* 戻るボタン */}
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
          注文一覧に戻る
        </button>
      )}

      <div className="rounded-lg border border-base-900/10 bg-white p-6">
        {/* ヘッダー */}
        <div className="mb-6 flex items-start justify-between border-b border-base-900/10 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-base-900">注文詳細</h1>
            <p className="mt-1 text-sm text-base-900/60">注文ID: {order.id}</p>
            <p className="text-sm text-base-900/60">
              注文日時: {formatDateTime(order.createdAt)}
            </p>
          </div>
          <span
            data-testid="order-status"
            className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${statusColors[order.status]}`}
          >
            {statusLabels[order.status]}
          </span>
        </div>

        {/* 商品一覧 */}
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-base-900">注文商品</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-base-900/10 pb-4 last:border-0"
              >
                <div>
                  <p className="font-medium text-base-900">{item.productName}</p>
                  <p className="text-sm text-base-900/60">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <p className="font-bold text-base-900">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 合計 */}
        <div className="flex items-center justify-between border-t border-base-900/10 pt-6">
          <p className="text-lg font-semibold text-base-900">合計</p>
          <p className="text-2xl font-bold text-base-900">
            {formatPrice(order.totalAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}
