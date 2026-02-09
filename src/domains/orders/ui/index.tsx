'use client';

/**
 * Orders ドメイン - 購入者向け UI 実装
 * CheckoutView, OrderCompletePage, OrderList, OrderDetail
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Order } from '@/contracts/orders';
import { Loading } from '@/templates/ui/components/status/Loading';
import { Error as ErrorDisplay } from '@/templates/ui/components/status/Error';
import { Empty } from '@/templates/ui/components/status/Empty';

// ─────────────────────────────────────────────────────────────────
// 共通ユーティリティ
// ─────────────────────────────────────────────────────────────────

const statusLabels: Record<Order['status'], string> = {
  pending: '保留中',
  confirmed: '確認済み',
  shipped: '発送済み',
  delivered: '配送完了',
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
// CheckoutView — チェックアウト画面
// ─────────────────────────────────────────────────────────────────

interface CartData {
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  itemCount: number;
}

export function CheckoutView() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/cart');
        if (!res.ok) throw new Error('カートの取得に失敗しました');
        const json = await res.json();
        if (!json.success) throw new Error('カートの取得に失敗しました');

        if (!json.data.items || json.data.items.length === 0) {
          router.push('/cart');
          return;
        }
        setCart(json.data);
      } catch {
        setError('カートの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [router]);

  const handleConfirmOrder = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || '注文の作成に失敗しました');
        setIsSubmitting(false);
        return;
      }
      window.dispatchEvent(new Event('cart-updated'));
      router.push(`/order-complete?orderId=${json.data.id}`);
    } catch {
      setError('注文の作成に失敗しました');
      setIsSubmitting(false);
    }
  }, [router]);

  if (isLoading) return <Loading message="カート情報を読み込み中..." />;
  if (error) return <ErrorDisplay message={error} />;
  if (!cart) return null;

  const tax = Math.floor(cart.subtotal * 0.1);
  const total = cart.subtotal + tax;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-base-900">注文内容の確認</h1>

      <div className="rounded-lg border border-base-900/10 bg-white p-6">
        {cart.items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center justify-between border-b border-base-900/10 py-4 last:border-0"
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

        <div className="mt-6 border-t border-base-900/10 pt-6 space-y-2">
          <div className="flex justify-between">
            <p className="text-sm text-base-900/60">商品合計</p>
            <p className="font-bold text-base-900">{formatPrice(cart.subtotal)}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-base-900/60">消費税（10%）</p>
            <p className="text-base-900">{formatPrice(tax)}</p>
          </div>
          <div className="flex justify-between border-t border-base-900/10 pt-2">
            <p className="font-bold text-base-900">総合計</p>
            <p className="text-2xl font-bold text-base-900">{formatPrice(total)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleConfirmOrder}
          disabled={isSubmitting}
          className="rounded-md bg-base-900 px-8 py-3 text-sm font-medium text-base-50 hover:bg-base-900/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '処理中...' : '注文を確定'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// OrderCompletePage — 注文完了画面
// ─────────────────────────────────────────────────────────────────

export function OrderCompletePage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="rounded-lg border border-base-900/10 bg-white p-8">
        <div className="mb-6 flex justify-center">
          <svg className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-base-900">ご注文ありがとうございます</h1>
        <p className="mb-6 text-base-900/60">
          注文ID: {orderId}
        </p>
        <Link
          href="/catalog"
          className="inline-block rounded-md bg-base-900 px-6 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90"
        >
          商品一覧に戻る
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// OrderList — 購入者の注文一覧
// ─────────────────────────────────────────────────────────────────

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/orders?page=${page}&limit=20`);
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
    })();
  }, [page]);

  if (isLoading) return <Loading message="注文履歴を読み込み中..." />;
  if (error) return <ErrorDisplay message={error} />;
  if (orders.length === 0) return <Empty message="注文履歴がありません" />;

  return (
    <div>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// OrderDetail — 購入者の注文詳細
// ─────────────────────────────────────────────────────────────────

export function OrderDetail() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

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

  if (isLoading) return <Loading message="注文情報を読み込み中..." />;
  if (error) return <ErrorDisplay message={error} />;
  if (!order) return <ErrorDisplay message="注文が見つかりません" />;

  return (
    <div className="mx-auto max-w-4xl">
      <button
        type="button"
        onClick={() => router.push('/orders')}
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
      </div>
    </div>
  );
}
