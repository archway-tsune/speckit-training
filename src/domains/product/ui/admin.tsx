'use client';

/**
 * Product ドメイン - 管理者向け UI コンポーネント
 * AdminProductDetail（編集ページ用）
 */
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProductForm } from './index';

export function AdminProductDetail() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<{
    name: string;
    price: number;
    stock: number;
    description?: string;
    imageUrl?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const json = await res.json();
        if (json.success) {
          setProduct(json.data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  if (isLoading) {
    return <p className="text-base-900/60">読み込み中...</p>;
  }

  if (notFound) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-base-900">404</h1>
        <p className="mt-2 text-base-900/60">商品が見つかりません</p>
      </div>
    );
  }

  return (
    <ProductForm
      productId={productId}
      initialData={product ?? undefined}
    />
  );
}
