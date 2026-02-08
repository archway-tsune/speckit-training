'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProductList } from '@/domains/catalog/ui';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const fetchProducts = useCallback(async (page = 1, keyword?: string) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        status: 'published',
      });
      if (keyword) {
        params.set('keyword', keyword);
      }

      const res = await fetch(`/api/catalog/products?${params}`);
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
    fetchProducts(page, searchKeyword);
  };

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    fetchProducts(1, keyword || undefined);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-base-900">商品一覧</h1>

      <ProductList
        products={products}
        isLoading={isLoading}
        error={error}
        pagination={pagination}
        onRetry={() => fetchProducts(1, searchKeyword || undefined)}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchKeyword={searchKeyword}
      />
    </div>
  );
}
