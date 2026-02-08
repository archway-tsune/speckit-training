'use client';

/**
 * OrderDetail コンポーネント
 * 注文詳細表示（購入者用）
 */
import React from 'react';
import type { Order } from '@/contracts/orders';
import { Loading } from '@/templates/ui/components/status/Loading';
import { Error } from '@/templates/ui/components/status/Error';
import { statusLabels, statusColors, formatPrice, formatDateTime } from './helpers';

export interface OrderDetailProps {
  order: Order | null;
  isLoading: boolean;
  error?: string;
  showCompletedMessage?: boolean;
  onBack?: () => void;
}

export function OrderDetail({
  order,
  isLoading,
  error,
  showCompletedMessage,
  onBack,
}: OrderDetailProps) {
  if (isLoading) {
    return <Loading message="注文情報を読み込み中..." />;
  }

  if (error) {
    return <Error message={error} />;
  }

  if (!order) {
    return <Error message="注文が見つかりません" />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* 注文完了メッセージ */}
      {showCompletedMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-lg font-semibold text-green-800">
            ご注文ありがとうございます
          </p>
          <p className="mt-2 text-sm text-green-600">
            注文が正常に受け付けられました。
          </p>
        </div>
      )}

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
