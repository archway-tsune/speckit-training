/**
 * インメモリ商品リポジトリ
 * デモ・テスト用
 *
 * 注意: Next.js開発モードではHMRによりモジュールが再読み込みされるため、
 * グローバル変数を使用してデータを保持しています。
 */
import type { Product } from '@/contracts/catalog';
import type { ProductRepository } from '@/contracts/catalog';

// サンプル商品データ（15件以上、在庫0の商品を含む）
const sampleProducts: Product[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'E2Eテスト商品',
    price: 3000,
    description: 'E2Eテスト用のデモ商品です。',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'ミニマルTシャツ',
    price: 4980,
    description: 'シンプルで上質なコットン100%のTシャツ。どんなスタイルにも合わせやすい定番アイテムです。',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    stock: 25,
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'レザーウォレット',
    price: 12800,
    description: '職人が一つ一つ手作りした本革財布。使い込むほど味わいが増します。',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop',
    stock: 8,
    status: 'published',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'キャンバストートバッグ',
    price: 6800,
    description: '丈夫なキャンバス生地を使用したシンプルなトートバッグ。A4サイズも余裕で収納できます。',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop',
    stock: 15,
    status: 'published',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'ウールニット',
    price: 15800,
    description: 'メリノウール100%の上質なニット。軽くて暖かく、チクチクしません。',
    imageUrl: 'https://images.unsplash.com/photo-1604644401890-0bd678c83788?w=400&h=400&fit=crop',
    stock: 0,
    status: 'published',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'デニムパンツ',
    price: 9800,
    description: '日本製セルビッジデニムを使用したストレートパンツ。長く愛用できる一本です。',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
    stock: 12,
    status: 'draft',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'コットンシャツ',
    price: 7800,
    description: 'オーガニックコットンを使用した肌触りの良いシャツ。ビジネスにもカジュアルにも。',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop',
    stock: 20,
    status: 'published',
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'スニーカー',
    price: 13800,
    description: '軽量で履き心地の良いスニーカー。長時間歩いても疲れにくい設計です。',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    stock: 30,
    status: 'published',
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-07'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'シルクスカーフ',
    price: 8500,
    description: '上質なシルク100%のスカーフ。さまざまな巻き方でコーディネートを楽しめます。',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop',
    stock: 5,
    status: 'published',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    name: 'リネンパンツ',
    price: 11000,
    description: 'フレンチリネンを使用した涼しげなパンツ。夏の定番アイテムです。',
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop',
    stock: 0,
    status: 'published',
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-09'),
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000a',
    name: 'カシミヤマフラー',
    price: 19800,
    description: 'カシミヤ100%の贅沢なマフラー。軽くて暖かく、上品な光沢があります。',
    imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=400&fit=crop',
    stock: 7,
    status: 'published',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000b',
    name: 'ナイロンバックパック',
    price: 14500,
    description: '防水ナイロン素材の大容量バックパック。通勤にも旅行にも使える万能アイテムです。',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    stock: 18,
    status: 'published',
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000c',
    name: 'ボーダーTシャツ',
    price: 5480,
    description: 'フランス製のボーダーTシャツ。コットン100%で着心地抜群です。',
    imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop',
    stock: 22,
    status: 'published',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000d',
    name: 'レザーベルト',
    price: 6500,
    description: 'イタリアンレザーを使用した上質なベルト。シンプルなデザインで長く使えます。',
    imageUrl: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400&h=400&fit=crop',
    stock: 14,
    status: 'published',
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000e',
    name: 'チノパンツ',
    price: 8800,
    description: 'ストレッチの効いたチノパンツ。きれいめからカジュアルまで幅広く活躍します。',
    imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop',
    stock: 16,
    status: 'published',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: '550e8400-e29b-41d4-a716-44665544000f',
    name: 'サングラス',
    price: 18000,
    description: 'UV400カットのおしゃれなサングラス。ドライブにもアウトドアにも最適です。',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
    stock: 9,
    status: 'archived',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
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
      description: data.description,
      imageUrl: data.imageUrl,
      stock: data.stock,
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

  async count(filter) {
    let items = Array.from(products.values());
    if (filter?.status) {
      items = items.filter((p) => p.status === filter.status);
    }
    if (filter?.keyword) {
      const kw = filter.keyword.toLowerCase();
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
