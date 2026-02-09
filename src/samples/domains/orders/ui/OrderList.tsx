'use client';

/**
 * OrderList コンポーネント
 * 注文一覧表示
 */
import React from 'react';
import Link from 'next/link';
import type { Order } from '@/contracts/orders';
import { Loading } from '@/templates/ui/components/status/Loading';
import { Error } from '@/templates/ui/components/status/Error';
import { Empty } from '@/templates/ui/components/status/Empty';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderListProps {
  orders: Order[];
  isLoading: boolean;
  error?: string;
  pagination: Pagination | null;
  basePath?: string;
  onPageChange?: (page: number) => void;
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function OrderRow({ order, basePath = '' }: { order: Order; basePath?: string }) {
  return (
    <Link
      href={`${basePath}/orders/${order.id}`}
      data-testid="order-row"
      className="block rounded-lg border border-base-900/10 bg-white p-4 hover:bg-base-50"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-base-900/60">注文ID: {order.id.slice(0, 8)}...</p>
          <p className="mt-1 font-medium text-base-900">
            {order.items.length}点の商品
          </p>
          <p className="text-sm text-base-900/60">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status]}`}
          >
            {statusLabels[order.status]}
          </span>
          <p className="mt-2 text-lg font-bold text-base-900">
            {formatPrice(order.totalAmount)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function OrderList({
  orders,
  isLoading,
  error,
  pagination,
  basePath = '',
  onPageChange,
}: OrderListProps) {
  // ローディング状態
  if (isLoading) {
    return <Loading message="注文履歴を読み込み中..." />;
  }

  // エラー状態
  if (error) {
    return <Error message={error} />;
  }

  // 空状態
  if (orders.length === 0) {
    return <Empty message="注文履歴がありません" />;
  }

  return (
    <div>
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} basePath={basePath} />
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
    </div>
  );
}
