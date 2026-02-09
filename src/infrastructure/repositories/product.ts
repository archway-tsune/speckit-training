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
    stock: 10,
    description: 'E2Eテスト用のデモ商品です。',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'ミニマルTシャツ',
    price: 4980,
    stock: 25,
    description: 'シンプルで上質なコットン100%のTシャツ。どんなスタイルにも合わせやすい定番アイテムです。',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'レザーウォレット',
    price: 12800,
    stock: 8,
    description: '職人が一つ一つ手作りした本革財布。使い込むほど味わいが増します。',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'キャンバストートバッグ',
    price: 6800,
    stock: 0,
    description: '丈夫なキャンバス生地を使用したシンプルなトートバッグ。A4サイズも余裕で収納できます。',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'ウールニット',
    price: 15800,
    stock: 15,
    description: 'メリノウール100%の上質なニット。軽くて暖かく、チクチクしません。',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'デニムパンツ',
    price: 9800,
    stock: 20,
    description: '日本製セルビッジデニムを使用したストレートパンツ。長く愛用できる一本です。',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'リネンシャツ',
    price: 8900,
    stock: 12,
    description: 'フレンチリネンを使用した涼しげなシャツ。夏の定番アイテムです。',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'スニーカー',
    price: 13500,
    stock: 18,
    description: '軽量で履き心地の良いレザースニーカー。オンオフ問わず活躍します。',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-07'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'コットンパーカー',
    price: 11800,
    stock: 9,
    description: '裏起毛のコットンパーカー。シンプルなデザインで着回し力抜群です。',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    name: 'シルクスカーフ',
    price: 7200,
    stock: 5,
    description: '上質なシルク100%のスカーフ。首元を華やかに彩ります。',
    imageUrl: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-09'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    name: 'チノパンツ',
    price: 8500,
    stock: 22,
    description: 'ストレッチの効いたチノパンツ。きれいめからカジュアルまで対応します。',
    imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    name: 'ボーダーカットソー',
    price: 5400,
    stock: 30,
    description: 'バスクシャツ風のボーダーカットソー。厚手のコットンで長く着られます。',
    imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    name: 'レザーベルト',
    price: 6500,
    stock: 14,
    description: 'イタリアンレザーを使用したベルト。シンプルなバックルデザインです。',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    name: 'カシミヤマフラー',
    price: 19800,
    stock: 3,
    description: '最高級カシミヤ100%のマフラー。軽くて暖かい冬の必需品です。',
    imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=400&fit=crop',
    status: 'published',
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
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

    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          (p.description && p.description.toLowerCase().includes(kw))
      );
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
      stock: data.stock,
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

  async count(status, keyword) {
    let items = Array.from(products.values());
    if (status) {
      items = items.filter((p) => p.status === status);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          (p.description && p.description.toLowerCase().includes(kw))
      );
    }
    return items.length;
  },
};

// テスト用：商品ストアをリセット（サンプルデータを再投入）
export function resetProductStore(): void {
  products.clear();
  sampleProducts.forEach((p) => products.set(p.id, { ...p }));
}
