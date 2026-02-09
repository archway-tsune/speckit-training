'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Cart } from '@/contracts/cart';

interface CartResponse {
  success: boolean;
  data?: Cart;
  error?: { message: string };
}

interface OrderResponse {
  success: boolean;
  data?: { id: string };
  error?: { message: string };
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const res = await fetch('/sample/api/cart');
      const data: CartResponse = await res.json();

      if (data.success && data.data) {
        setCart(data.data);
        if (data.data.items.length === 0) {
          router.push('/sample/cart');
        }
      } else if (res.status === 401) {
        router.push('/sample/login');
        return;
      } else {
        setError(data.error?.message || 'カートの取得に失敗しました');
      }
    } catch {
      setError('カートの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    setError(undefined);

    try {
      const res = await fetch('/sample/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });

      const data: OrderResponse = await res.json();

      if (data.success && data.data) {
        window.dispatchEvent(new CustomEvent('cart-updated'));
        router.push(`/sample/orders/${data.data.id}?completed=true`);
      } else {
        setError(data.error?.message || '注文の作成に失敗しました');
      }
    } catch {
      setError('注文の作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-center text-base-900/60">読み込み中...</p>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-center text-base-900/60">カートが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-base-900">注文確認</h1>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-base-900/10 bg-white p-6">
        {/* 商品一覧 */}
        <h2 className="mb-4 text-lg font-semibold text-base-900">注文商品</h2>
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.productId}
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

        {/* 合計 */}
        <div className="mt-6 flex items-center justify-between border-t border-base-900/10 pt-6">
          <p className="text-lg font-semibold text-base-900">合計</p>
          <p className="text-2xl font-bold text-base-900" data-testid="cart-subtotal">
            {formatPrice(cart.subtotal)}
          </p>
        </div>

        {/* 注文ボタン */}
        <button
          type="button"
          onClick={handleSubmitOrder}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-md bg-base-900 px-6 py-3 text-base font-medium text-base-50 hover:bg-base-900/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '注文処理中...' : '注文を確定'}
        </button>
      </div>
    </div>
  );
}
