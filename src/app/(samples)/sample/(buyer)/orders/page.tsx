'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OrderList } from '@/samples/domains/orders/ui/OrderList';
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

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const fetchOrders = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const res = await fetch(`/sample/api/orders?page=${page}`);
      const data: OrdersResponse = await res.json();

      if (data.success && data.data) {
        // Date をパース
        const parsedOrders = data.data.orders.map((order) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        }));
        setOrders(parsedOrders);
        setPagination(data.data.pagination);
      } else if (res.status === 401) {
        router.push('/sample/login');
        return;
      } else {
        setError(data.error?.message || '注文履歴の取得に失敗しました');
      }
    } catch {
      setError('注文履歴の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePageChange = (page: number) => {
    fetchOrders(page);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-base-900">注文履歴</h1>

      <OrderList
        orders={orders}
        isLoading={isLoading}
        error={error}
        pagination={pagination}
        basePath="/sample"
        onPageChange={handlePageChange}
      />
    </div>
  );
}
