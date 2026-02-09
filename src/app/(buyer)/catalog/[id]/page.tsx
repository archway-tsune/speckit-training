'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductDetail } from '@/domains/catalog/ui';
import type { Product } from '@/contracts/catalog';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<string | undefined>();

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(undefined);

      try {
        const res = await fetch(`/api/catalog/products/${params.id}`);
        if (!res.ok) {
          throw new Error('商品が見つかりません');
        }

        const json = await res.json();
        setProduct(json.data);
      } catch {
        setError('商品が見つかりません');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = useCallback(async (productId: string) => {
    setIsAdding(true);
    setFeedback(undefined);

    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/catalog/${params.id}`);
        return;
      }

      if (!res.ok) {
        const json = await res.json();
        setFeedback(json.message || 'カートへの追加に失敗しました');
        return;
      }

      setFeedback('カートに追加しました');
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      setFeedback('カートへの追加に失敗しました');
    } finally {
      setIsAdding(false);
    }
  }, [router, params.id]);

  return (
    <>
      <ProductDetail
        product={product}
        isLoading={isLoading}
        error={error}
        onAddToCart={handleAddToCart}
        onBack={() => router.push('/catalog')}
        isAddingToCart={isAdding}
      />
      {feedback && (
        <div className="mx-auto mt-4 max-w-4xl">
          <p className={`rounded-md px-4 py-2 text-sm ${feedback.includes('失敗') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {feedback}
          </p>
        </div>
      )}
    </>
  );
}
