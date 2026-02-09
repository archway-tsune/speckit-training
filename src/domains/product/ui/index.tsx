'use client';

/**
 * Product ドメイン - UI コンポーネント
 * AdminProductList, ProductForm
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConfirmDialog } from '@/templates/ui/components/dialog/ConfirmDialog';

// ─────────────────────────────────────────────────────────────────
// AdminProductList
// ─────────────────────────────────────────────────────────────────

interface ProductItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_LABELS: Record<string, string> = {
  draft: '下書き',
  published: '公開中',
  archived: 'アーカイブ',
};

export function AdminProductList() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);

  const fetchProducts = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products?page=${page}&limit=20`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setProducts(json.data.products);
          setPagination(json.data.pagination);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, fetchProducts]);

  const handleStatusChange = async (productId: string, newStatus: string) => {
    const res = await fetch(`/api/products/${productId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      fetchProducts(currentPage);
    }
  };

  const handleDelete = async (product: ProductItem) => {
    setDeleteTarget(product);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/products/${deleteTarget.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setDeleteTarget(null);
      fetchProducts(currentPage);
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  if (isLoading && products.length === 0) {
    return <p className="text-base-900/60">読み込み中...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base-900">商品管理</h1>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-base-900 px-4 py-2 text-sm text-base-50 hover:bg-base-900/90"
        >
          新規登録
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-base-900/60">商品がありません</p>
      ) : (
        <>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left text-sm text-base-900/60">
                <th className="pb-2">商品名</th>
                <th className="pb-2">価格</th>
                <th className="pb-2">在庫数</th>
                <th className="pb-2">ステータス</th>
                <th className="pb-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b">
                  <td className="py-3">{product.name}</td>
                  <td className="py-3">&yen;{product.price.toLocaleString()}</td>
                  <td className="py-3">{product.stock}</td>
                  <td className="py-3">
                    <select
                      role="combobox"
                      value={product.status}
                      onChange={(e) => handleStatusChange(product.id, e.target.value)}
                      className="rounded border px-2 py-1 text-sm"
                    >
                      <option value="draft">{STATUS_LABELS.draft}</option>
                      <option value="published">{STATUS_LABELS.published}</option>
                      <option value="archived">{STATUS_LABELS.archived}</option>
                    </select>
                  </td>
                  <td className="py-3 space-x-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="rounded border px-3 py-1 text-sm hover:bg-base-100"
                    >
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(product)}
                      className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && pagination.total > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-base-900/60">
              <span>全 {pagination.total} 件</span>
              {pagination.totalPages > 1 && (
                <div className="flex gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`rounded px-3 py-1 ${
                          page === currentPage
                            ? 'bg-base-900 text-base-50'
                            : 'hover:bg-base-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`「${deleteTarget?.name ?? ''}」を削除しますか？`}
        confirmLabel="削除する"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ProductForm
// ─────────────────────────────────────────────────────────────────

interface ProductFormProps {
  productId?: string;
  initialData?: {
    name: string;
    price: number;
    stock: number;
    description?: string;
    imageUrl?: string;
  };
}

export function ProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!productId;

  const [name, setName] = useState(initialData?.name ?? '');
  const [price, setPrice] = useState(initialData?.price?.toString() ?? '');
  const [stock, setStock] = useState(initialData?.stock?.toString() ?? '0');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {};

      if (isEdit) {
        // 部分更新: 変更されたフィールドのみ送信
        if (name !== (initialData?.name ?? '')) body.name = name;
        if (price !== (initialData?.price?.toString() ?? '')) body.price = Number(price);
        if (stock !== (initialData?.stock?.toString() ?? '0')) body.stock = Number(stock);
        if (description !== (initialData?.description ?? '')) body.description = description;
        if (imageUrl !== (initialData?.imageUrl ?? '')) body.imageUrl = imageUrl || undefined;
      } else {
        body.name = name;
        body.price = Number(price);
        body.stock = Number(stock);
        if (description) body.description = description;
        if (imageUrl) body.imageUrl = imageUrl;
      }

      const url = isEdit ? `/api/products/${productId}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (json.success) {
        router.push('/admin/products');
      } else if (json.error?.fieldErrors) {
        const fieldErrors: Record<string, string> = {};
        for (const err of json.error.fieldErrors) {
          fieldErrors[err.field] = err.message;
        }
        setErrors(fieldErrors);
      } else {
        setErrors({ form: json.error?.message || 'エラーが発生しました' });
      }
    } catch {
      setErrors({ form: 'エラーが発生しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-base-900">
        {isEdit ? '商品編集' : '商品登録'}
      </h1>

      {errors.form && (
        <p className="text-sm text-red-600">{errors.form}</p>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          商品名 <span className="text-red-600">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="price" className="mb-1 block text-sm font-medium">
          価格 <span className="text-red-600">*</span>
        </label>
        <input
          id="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded border px-3 py-2"
          min="0"
          required
        />
        {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
      </div>

      <div>
        <label htmlFor="stock" className="mb-1 block text-sm font-medium">
          在庫数
        </label>
        <input
          id="stock"
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-full rounded border px-3 py-2"
          min="0"
        />
        {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          説明
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded border px-3 py-2"
          rows={4}
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div>
        <label htmlFor="imageUrl" className="mb-1 block text-sm font-medium">
          画像URL
        </label>
        <input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
        {errors.imageUrl && <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-base-900 px-6 py-2 text-sm text-base-50 hover:bg-base-900/90 disabled:opacity-50"
        >
          {isSubmitting ? '送信中...' : isEdit ? '保存' : '登録'}
        </button>
        <Link
          href="/admin/products"
          className="rounded-md border px-6 py-2 text-sm hover:bg-base-100"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
