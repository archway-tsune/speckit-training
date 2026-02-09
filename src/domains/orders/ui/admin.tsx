'use client';

/**
 * Orders ドメイン - 管理者向け UI 実装
 * AdminOrderList, AdminOrderDetail
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Order, OrderStatus } from '@/contracts/orders';
import { ValidStatusTransitions } from '@/contracts/orders';
import { Loading } from '@/templates/ui/components/status/Loading';
import { Error as ErrorDisplay } from '@/templates/ui/components/status/Error';
import { Empty } from '@/templates/ui/components/status/Empty';

// ─────────────────────────────────────────────────────────────────
// 共通ユーティリティ
// ─────────────────────────────────────────────────────────────────

const statusLabels: Record<OrderStatus, string> = {
  pending: '保留中',
  confirmed: '確認済み',
  shipped: '発送済み',
  delivered: '配送完了',
  cancelled: 'キャンセル',
};

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// ─────────────────────────────────────────────────────────────────
// AdminOrderList — 管理者の注文一覧
// ─────────────────────────────────────────────────────────────────

export function AdminOrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/orders?page=${page}&limit=20`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('注文の取得に失敗しました');
      const json = await res.json();
      if (!json.success) throw new Error('注文の取得に失敗しました');
      setOrders(json.data.orders);
      setPagination(json.data.pagination);
    } catch {
      setError('注文の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  if (isLoading) return <Loading message="注文一覧を読み込み中..." />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base-900">注文管理</h1>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="rounded-md border border-base-900/20 px-3 py-2 text-sm text-base-900"
        >
          <option value="">全件</option>
          <option value="pending">保留中</option>
          <option value="confirmed">確認済み</option>
          <option value="shipped">発送済み</option>
          <option value="delivered">配送完了</option>
          <option value="cancelled">キャンセル</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <Empty message="該当する注文がありません" />
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
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
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                    <p className="mt-2 text-lg font-bold text-base-900">
                      {formatPrice(order.totalAmount)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-base-900/10 pt-4">
              <p className="text-sm text-base-900/70">
                全{pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1}〜
                {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded-md border border-base-900/20 px-4 py-2 text-sm font-medium text-base-900 hover:bg-base-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  前へ
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-md border border-base-900/20 px-4 py-2 text-sm font-medium text-base-900 hover:bg-base-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  次へ
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AdminOrderDetail — 管理者の注文詳細
// ─────────────────────────────────────────────────────────────────

export function AdminOrderDetail() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) throw new Error('注文の取得に失敗しました');
        const json = await res.json();
        if (!json.success) throw new Error('注文の取得に失敗しました');
        setOrder(json.data);
      } catch {
        setError('注文の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [orderId]);

  const handleStatusUpdate = useCallback(async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    setUpdateMessage(undefined);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setUpdateMessage(json.message || 'ステータスの更新に失敗しました');
        return;
      }
      setOrder((prev) => prev ? { ...prev, status: json.data.status, updatedAt: json.data.updatedAt } : prev);
      setUpdateMessage(`ステータスを「${statusLabels[newStatus]}」に更新しました`);
    } catch {
      setUpdateMessage('ステータスの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  }, [orderId]);

  if (isLoading) return <Loading message="注文情報を読み込み中..." />;
  if (error) return <ErrorDisplay message={error} />;
  if (!order) return <ErrorDisplay message="注文が見つかりません" />;

  const availableTransitions = ValidStatusTransitions[order.status] || [];

  return (
    <div className="mx-auto max-w-4xl">
      <button
        type="button"
        onClick={() => router.push('/admin/orders')}
        className="mb-6 flex items-center gap-2 text-sm text-base-900/70 hover:text-base-900"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        注文一覧に戻る
      </button>

      <div className="rounded-lg border border-base-900/10 bg-white p-6">
        <div className="mb-6 flex items-start justify-between border-b border-base-900/10 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-base-900">注文詳細</h1>
            <p className="mt-1 text-sm text-base-900/60">注文ID: {order.id}</p>
            <p className="text-sm text-base-900/60">
              注文日時: {formatDateTime(order.createdAt)}
            </p>
          </div>
          <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${statusColors[order.status]}`}>
            {statusLabels[order.status]}
          </span>
        </div>

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

        <div className="flex items-center justify-between border-t border-base-900/10 pt-6">
          <p className="text-lg font-semibold text-base-900">合計</p>
          <p className="text-2xl font-bold text-base-900">
            {formatPrice(order.totalAmount)}
          </p>
        </div>

        {updateMessage && (
          <div className="mt-6 border-t border-base-900/10 pt-6">
            <p className="text-sm text-base-900/70">{updateMessage}</p>
          </div>
        )}

        {availableTransitions.length > 0 && (
          <div className={`${updateMessage ? 'mt-4' : 'mt-6 border-t border-base-900/10 pt-6'}`}>
            <h2 className="mb-4 text-lg font-semibold text-base-900">ステータス変更</h2>
            <div className="flex gap-3">
              {availableTransitions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusUpdate(status)}
                  disabled={isUpdating}
                  className={`rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                    status === 'cancelled'
                      ? 'border border-red-300 text-red-700 hover:bg-red-50'
                      : 'bg-base-900 text-base-50 hover:bg-base-900/90'
                  }`}
                >
                  {statusLabels[status]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
