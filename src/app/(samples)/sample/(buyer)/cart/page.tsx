'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CartView } from '@/samples/domains/cart/ui/CartView';
import type { Cart } from '@/contracts/cart';

interface CartResponse {
  success: boolean;
  data?: Cart;
  error?: { message: string };
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const res = await fetch('/sample/api/cart');
      const data: CartResponse = await res.json();

      if (data.success && data.data) {
        setCart(data.data);
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

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      const res = await fetch(`/sample/api/cart/items/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      if (res.ok) {
        const data: CartResponse = await res.json();
        if (data.success && data.data) {
          setCart(data.data);
          window.dispatchEvent(new CustomEvent('cart-updated'));
        }
      }
    } catch {
      // エラーハンドリング
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      const res = await fetch(`/sample/api/cart/items/${productId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data: CartResponse = await res.json();
        if (data.success && data.data) {
          setCart(data.data);
          window.dispatchEvent(new CustomEvent('cart-updated'));
        }
      }
    } catch {
      // エラーハンドリング
    }
  };

  const handleCheckout = () => {
    router.push('/sample/checkout');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-base-900">カート</h1>
      <CartView
        cart={cart}
        isLoading={isLoading}
        error={error}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
