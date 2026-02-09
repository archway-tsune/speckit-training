'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { Product } from '@/contracts/catalog';
import { ConfirmDialog } from '@/templates/ui/components/dialog';

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

const statusLabels: Record<Product['status'], string> = {
  draft: '下書き',
  published: '公開中',
  archived: 'アーカイブ',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/sample/api/catalog/products?limit=100');
      const data: ProductsResponse = await res.json();
      if (data.success && data.data) {
        setProducts(data.data.products);
      }
    } catch {
      // エラーハンドリング
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleStatusChange = async (productId: string, status: string) => {
    try {
      await fetch(`/sample/api/catalog/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchProducts();
    } catch {
      // エラーハンドリング
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await fetch(`/sample/api/catalog/products/${productId}`, {
        method: 'DELETE',
      });
      setDeleteConfirm(null);
      fetchProducts();
    } catch {
      // エラーハンドリング
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-base-900">商品管理</h1>
        <Link
          href="/sample/admin/products/new"
          className="rounded-md bg-base-900 px-6 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90"
        >
          新規登録
        </Link>
      </div>

      {isLoading ? (
        <p className="text-base-900/60">読み込み中...</p>
      ) : (
        <div className="rounded-lg border border-base-900/10 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base-900/10">
                <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">商品名</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">価格</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">ステータス</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-base-900/60">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  data-testid="product-row"
                  className="border-b border-base-900/10 last:border-0"
                >
                  <td className="px-4 py-3">{product.name}</td>
                  <td className="px-4 py-3">¥{product.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <select
                      data-testid="status-select"
                      value={product.status}
                      onChange={(e) => handleStatusChange(product.id, e.target.value)}
                      className="rounded-md border border-base-900/20 px-2 py-1 text-sm"
                    >
                      <option value="draft">下書き</option>
                      <option value="published">公開中</option>
                      <option value="archived">アーカイブ</option>
                    </select>
                    <span data-testid="status-badge" className="ml-2 text-xs text-base-900/60">
                      {statusLabels[product.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/sample/admin/products/${product.id}/edit`}
                        data-testid="edit-button"
                        className="rounded-md border border-base-900/20 px-3 py-1 text-sm hover:bg-base-100"
                      >
                        編集
                      </Link>
                      <button
                        type="button"
                        data-testid="delete-button"
                        onClick={() => setDeleteConfirm(product.id)}
                        className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        message="この商品を削除しますか？"
        confirmLabel="削除する"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
