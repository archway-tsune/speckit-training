'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProductList } from '@/samples/domains/catalog/ui/ProductList';
import type { Product } from '@/contracts/catalog';

interface ProductsResponse {
  success: boolean;
  data?: {
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: { message: string };
}

export default function CatalogPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const fetchProducts = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const res = await fetch(`/sample/api/catalog/products?page=${page}&status=published`);
      const data: ProductsResponse = await res.json();

      if (data.success && data.data) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      } else {
        setError(data.error?.message || '商品の取得に失敗しました');
      }
    } catch {
      setError('商品の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handlePageChange = (page: number) => {
    fetchProducts(page);
  };

  const handleAddToCart = async (productId: string) => {
    setMessage(undefined);
    try {
      const res = await fetch('/sample/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('cart-updated'));
        setMessage('カートに追加しました');
        setTimeout(() => setMessage(undefined), 3000);
      } else if (res.status === 401) {
        // 未ログインの場合はログインページへ
        router.push('/sample/login');
      } else {
        const data = await res.json();
        setMessage(data.error?.message || 'カートへの追加に失敗しました');
      }
    } catch {
      setMessage('カートへの追加に失敗しました');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-base-900">商品一覧</h1>

      {message && (
        <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      <ProductList
        products={products}
        isLoading={isLoading}
        error={error}
        pagination={pagination}
        basePath="/sample"
        onRetry={() => fetchProducts()}
        onPageChange={handlePageChange}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
