'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductDetail } from '@/domains/catalog/ui';
import type { Product } from '@/contracts/catalog';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

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

  return (
    <ProductDetail
      product={product}
      isLoading={isLoading}
      error={error}
      onBack={() => router.push('/catalog')}
    />
  );
}
