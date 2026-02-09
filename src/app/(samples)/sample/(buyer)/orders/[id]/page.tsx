'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { OrderDetail } from '@/samples/domains/orders/ui/OrderDetail';
import type { Order } from '@/contracts/orders';

interface OrderResponse {
  success: boolean;
  data?: Order;
  error?: { message: string };
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCompleted = searchParams.get('completed') === 'true';

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const fetchOrder = useCallback(async () => {
    if (!params.id) return;
    setIsLoading(true);
    setError(undefined);

    try {
      const res = await fetch(`/sample/api/orders/${params.id}`);
      const data: OrderResponse = await res.json();

      if (data.success && data.data) {
        setOrder({
          ...data.data,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt),
        });
      } else if (res.status === 401) {
        router.push('/sample/login');
        return;
      } else {
        setError(data.error?.message || '注文の取得に失敗しました');
      }
    } catch {
      setError('注文の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleBack = () => {
    router.push('/sample/orders');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {isCompleted && (
        <div className="mb-6 rounded-md bg-green-50 p-4 text-center text-green-800">
          ご注文ありがとうございます
        </div>
      )}

      <OrderDetail
        order={order}
        isLoading={isLoading}
        error={error}
        onBack={handleBack}
      />
    </div>
  );
}
