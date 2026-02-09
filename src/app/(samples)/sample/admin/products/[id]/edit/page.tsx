'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Product } from '@/contracts/catalog';

interface ProductResponse {
  success: boolean;
  data?: Product;
  error?: { message: string };
}

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/sample/api/catalog/products/${params.id}`);
        const data: ProductResponse = await res.json();
        if (data.success && data.data) {
          setProduct(data.data);
        }
      } catch {
        // エラーハンドリング
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      description: formData.get('description') as string,
    };

    try {
      const res = await fetch(`/sample/api/catalog/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        router.push('/sample/admin/products');
      } else {
        setError(result.error?.message || '商品の更新に失敗しました');
      }
    } catch {
      setError('商品の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-8 text-3xl font-bold text-base-900">商品編集</h1>
        <p className="text-base-900/60">読み込み中...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <h1 className="mb-8 text-3xl font-bold text-base-900">商品編集</h1>
        <p className="text-red-600">商品が見つかりません</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-base-900">商品編集</h1>

      <form onSubmit={handleSubmit} className="max-w-xl">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4 rounded-lg border border-base-900/10 bg-white p-6">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-base-900">
              商品名 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={product.name}
              required
              className="w-full rounded-md border border-base-900/20 px-4 py-2 text-base-900 focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900"
            />
          </div>

          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-medium text-base-900">
              価格 *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              defaultValue={product.price}
              required
              min="0"
              className="w-full rounded-md border border-base-900/20 px-4 py-2 text-base-900 focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-base-900">
              説明
            </label>
            <textarea
              id="description"
              name="description"
              defaultValue={product.description || ''}
              rows={4}
              className="w-full rounded-md border border-base-900/20 px-4 py-2 text-base-900 focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/sample/admin/products')}
              className="rounded-md border border-base-900/20 px-6 py-2 text-sm font-medium text-base-900 hover:bg-base-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-base-900 px-6 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
