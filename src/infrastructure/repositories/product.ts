/**
 * インメモリ商品リポジトリ
 * デモ・テスト用
 *
 * 注意: Next.js開発モードではHMRによりモジュールが再読み込みされるため、
 * グローバル変数を使用してデータを保持しています。
 */
import type { Product } from '@/contracts/catalog';
import type { ProductRepository } from '@/contracts/catalog';

// サンプル商品データ
const sampleProducts: Product[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'E2Eテスト商品',
    price: 3000,
    description: 'E2Eテスト用のデモ商品です。',
    imageUrl: 'https://picsum.photos/seed/test/400/400',
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'ミニマルTシャツ',
    price: 4980,
    description: 'シンプルで上質なコットン100%のTシャツ。どんなスタイルにも合わせやすい定番アイテムです。',
    imageUrl: 'https://picsum.photos/seed/tshirt/400/400',
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'レザーウォレット',
    price: 12800,
    description: '職人が一つ一つ手作りした本革財布。使い込むほど味わいが増します。',
    imageUrl: 'https://picsum.photos/seed/wallet/400/400',
    status: 'published',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'キャンバストートバッグ',
    price: 6800,
    description: '丈夫なキャンバス生地を使用したシンプルなトートバッグ。A4サイズも余裕で収納できます。',
    imageUrl: 'https://picsum.photos/seed/bag/400/400',
    status: 'published',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'ウールニット',
    price: 15800,
    description: 'メリノウール100%の上質なニット。軽くて暖かく、チクチクしません。',
    imageUrl: 'https://picsum.photos/seed/knit/400/400',
    status: 'published',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'デニムパンツ',
    price: 9800,
    description: '日本製セルビッジデニムを使用したストレートパンツ。長く愛用できる一本です。',
    imageUrl: 'https://picsum.photos/seed/denim/400/400',
    status: 'draft',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
];

// グローバル変数の型定義（HMR対策）
declare global {
  // eslint-disable-next-line no-var
  var __productStore: Map<string, Product> | undefined;
}

// インメモリストア
// HMR対策：グローバル変数を使用してデータを保持
function initializeProductStore(): Map<string, Product> {
  if (globalThis.__productStore) {
    return globalThis.__productStore;
  }
  const store = new Map<string, Product>(sampleProducts.map((p) => [p.id, p]));
  globalThis.__productStore = store;
  return store;
}

const products = initializeProductStore();

function generateId(): string {
  return crypto.randomUUID();
}

export const productRepository: ProductRepository = {
  async findAll(params) {
    let items = Array.from(products.values());

    if (params.status) {
      items = items.filter((p) => p.status === params.status);
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return items.slice(params.offset, params.offset + params.limit);
  },

  async findById(id) {
    return products.get(id) || null;
  },

  async create(data) {
    const now = new Date();
    const product: Product = {
      id: generateId(),
      name: data.name,
      price: data.price,
      description: data.description,
      imageUrl: data.imageUrl,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };
    products.set(product.id, product);
    return product;
  },

  async update(id, data) {
    const existing = products.get(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    const updated: Product = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      ),
      updatedAt: new Date(),
    };
    products.set(id, updated);
    return updated;
  },

  async delete(id) {
    products.delete(id);
  },

  async count(status) {
    let items = Array.from(products.values());
    if (status) {
      items = items.filter((p) => p.status === status);
    }
    return items.length;
  },
};

// テスト用：商品ストアをリセット（サンプルデータを再投入）
export function resetProductStore(): void {
  products.clear();
  sampleProducts.forEach((p) => products.set(p.id, { ...p }));
}
