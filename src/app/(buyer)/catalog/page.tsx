'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductList } from '@/domains/catalog/ui';
import type { Product } from '@/contracts/catalog';
import type { Pagination } from '@/domains/catalog/ui';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
      });
      if (keyword) {
        params.set('keyword', keyword);
      }

      const res = await fetch(`/api/catalog/products?${params}`);
      if (!res.ok) {
        throw new Error('商品の取得に失敗しました');
      }

      const json = await res.json();
      setProducts(json.data.products);
      setPagination(json.data.pagination);
    } catch {
      setError('商品の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword);
    setPage(1);
  };

  return (
    <ProductList
      products={products}
      isLoading={isLoading}
      error={error}
      pagination={pagination}
      onRetry={fetchProducts}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
    />
  );
}
