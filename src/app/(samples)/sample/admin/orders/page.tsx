'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Order } from '@/contracts/orders';

interface OrdersResponse {
  success: boolean;
  data?: {
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (statusFilter) {
        params.set('status', statusFilter);
      }

      const res = await fetch(`/sample/api/orders?${params}`);
      const data: OrdersResponse = await res.json();
      if (data.success && data.data) {
        const parsedOrders = data.data.orders.map((order) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        }));
        setOrders(parsedOrders);
      }
    } catch {
      // エラーハンドリング
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusFilterChange = (status: string) => {
    const params = new URLSearchParams();
    if (status) {
      params.set('status', status);
    }
    router.push(`/sample/admin/orders${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-base-900">注文管理</h1>
        <select
          data-testid="status-filter"
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="rounded-md border border-base-900/20 px-4 py-2 text-sm"
        >
          <option value="">すべて</option>
          <option value="pending">処理待ち</option>
          <option value="confirmed">確定済み</option>
          <option value="shipped">発送済み</option>
          <option value="delivered">配達完了</option>
          <option value="cancelled">キャンセル</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-base-900/60">読み込み中...</p>
      ) : orders.length === 0 ? (
        <p className="text-base-900/60">注文がありません</p>
      ) : (
        <div className="rounded-lg border border-base-900/10 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base-900/10">
                <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">注文ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">注文日時</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">商品数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">合計</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  data-testid="order-row"
                  onClick={() => router.push(`/sample/admin/orders/${order.id}`)}
                  className="cursor-pointer border-b border-base-900/10 last:border-0 hover:bg-base-50"
                >
                  <td className="px-4 py-3 text-sm">{order.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-sm">{order.items.length}点</td>
                  <td className="px-4 py-3 text-sm font-medium">{formatPrice(order.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span
                      data-testid="order-status"
                      className="rounded-full bg-base-100 px-3 py-1 text-xs font-medium"
                    >
                      {statusLabels[order.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
