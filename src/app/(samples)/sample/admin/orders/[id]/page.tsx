'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Order } from '@/contracts/orders';

interface OrderResponse {
  success: boolean;
  data?: Order;
  error?: { message: string };
}

const statusLabels: Record<Order['status'], string> = {
  pending: '処理待ち',
  confirmed: '確定済み',
  shipped: '発送済み',
  delivered: '配達完了',
  cancelled: 'キャンセル',
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

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!params.id) return;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/sample/api/orders/${params.id}`);
        const data: OrderResponse = await res.json();
        if (data.success && data.data) {
          const parsed = {
            ...data.data,
            createdAt: new Date(data.data.createdAt),
            updatedAt: new Date(data.data.updatedAt),
          };
          setOrder(parsed);
          setSelectedStatus(parsed.status);
        }
      } catch {
        // エラーハンドリング
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [params.id]);

  const handleUpdateStatus = async () => {
    if (!order || selectedStatus === order.status) return;

    setIsUpdating(true);
    setMessage('');

    try {
      const res = await fetch(`/sample/api/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const data: OrderResponse = await res.json();

      if (data.success && data.data) {
        setOrder({
          ...data.data,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
        });
        setMessage('ステータスを更新しました');
      } else {
        setMessage(data.error?.message || 'ステータスの更新に失敗しました');
      }
    } catch {
      setMessage('ステータスの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-8 text-3xl font-bold text-base-900">注文詳細</h1>
        <p className="text-base-900/60">読み込み中...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <h1 className="mb-8 text-3xl font-bold text-base-900">注文詳細</h1>
        <p className="text-red-600">注文が見つかりません</p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push('/sample/admin/orders')}
        className="mb-6 flex items-center gap-2 text-sm text-base-900/70 hover:text-base-900"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        注文一覧に戻る
      </button>

      <h1 className="mb-8 text-3xl font-bold text-base-900">注文詳細</h1>

      {message && (
        <div className={`mb-6 rounded-md p-4 text-sm ${
          message.includes('失敗') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 注文情報 */}
        <div className="rounded-lg border border-base-900/10 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-base-900">注文情報</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-base-900/60">注文ID</dt>
              <dd className="mt-1 font-medium">{order.id}</dd>
            </div>
            <div>
              <dt className="text-base-900/60">注文日時</dt>
              <dd className="mt-1">{formatDateTime(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-base-900/60">更新日時</dt>
              <dd className="mt-1">{formatDateTime(order.updatedAt)}</dd>
            </div>
          </dl>
        </div>

        {/* 顧客情報 */}
        <div className="rounded-lg border border-base-900/10 bg-white p-6" data-testid="customer-info">
          <h2 className="mb-4 text-lg font-semibold text-base-900">顧客情報</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-base-900/60">ユーザーID</dt>
              <dd className="mt-1 font-medium">{order.userId}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 注文商品 */}
      <div className="mt-6 rounded-lg border border-base-900/10 bg-white p-6" data-testid="order-items">
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
        <div className="mt-4 flex items-center justify-between border-t border-base-900/10 pt-4">
          <p className="text-lg font-semibold text-base-900">合計</p>
          <p className="text-2xl font-bold text-base-900">{formatPrice(order.totalAmount)}</p>
        </div>
      </div>

      {/* ステータス更新 */}
      <div className="mt-6 rounded-lg border border-base-900/10 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-base-900">ステータス更新</h2>
        <div className="flex items-center gap-4">
          <span
            data-testid="order-status"
            className="rounded-full bg-base-100 px-3 py-1 text-sm font-medium"
          >
            {statusLabels[order.status]}
          </span>
          <span className="text-base-900/40">→</span>
          <select
            data-testid="status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-md border border-base-900/20 px-4 py-2 text-sm"
          >
            <option value="pending">処理待ち</option>
            <option value="confirmed">確定済み</option>
            <option value="shipped">発送済み</option>
            <option value="delivered">配達完了</option>
            <option value="cancelled">キャンセル</option>
          </select>
          <button
            type="button"
            onClick={handleUpdateStatus}
            disabled={isUpdating || selectedStatus === order.status}
            className="rounded-md bg-base-900 px-6 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdating ? '更新中...' : 'ステータス更新'}
          </button>
        </div>
      </div>
    </div>
  );
}
