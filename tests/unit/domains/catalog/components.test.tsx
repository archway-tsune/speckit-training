/**
 * カタログドメイン — UIコンポーネント単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from '@/domains/catalog/ui/ProductCard';
import { ProductList } from '@/domains/catalog/ui/ProductList';
import { ProductDetail } from '@/domains/catalog/ui/ProductDetail';
import type { Product } from '@/contracts/catalog';

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'テスト商品',
    price: 1000,
    description: 'テスト説明文です。',
    imageUrl: 'https://example.com/image.jpg',
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────
// ProductCard
// ─────────────────────────────────────────────────────────────────

describe('ProductCard', () => {
  it('商品画像・商品名・価格・在庫状況が表示されること', () => {
    const product = createMockProduct();
    render(<ProductCard product={product} />);

    expect(screen.getByAltText('テスト商品')).toBeDefined();
    expect(screen.getByText('テスト商品')).toBeDefined();
    expect(screen.getByText('¥1,000')).toBeDefined();
  });

  it('在庫0の商品に「在庫切れ」と表示されること', () => {
    const product = createMockProduct({ stock: 0 });
    render(<ProductCard product={product} />);

    expect(screen.getByText('在庫切れ')).toBeDefined();
  });

  it('在庫がある商品には在庫切れ表示がないこと', () => {
    const product = createMockProduct({ stock: 10 });
    render(<ProductCard product={product} />);

    expect(screen.queryByText('在庫切れ')).toBeNull();
  });

  it('画像未設定の場合プレースホルダーが表示されること', () => {
    const product = createMockProduct({ imageUrl: undefined });
    render(<ProductCard product={product} />);

    expect(screen.getByTestId('product-image-placeholder')).toBeDefined();
  });

  it('商品名をクリックすると /catalog/{id} へのリンクであること', () => {
    const product = createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001' });
    render(<ProductCard product={product} />);

    const link = screen.getByTestId('product-card');
    expect(link.getAttribute('href')).toBe('/catalog/550e8400-e29b-41d4-a716-446655440001');
  });
});

// ─────────────────────────────────────────────────────────────────
// ProductList
// ─────────────────────────────────────────────────────────────────

describe('ProductList', () => {
  const defaultPagination = {
    page: 1,
    limit: 12,
    total: 2,
    totalPages: 1,
  };

  it('商品がグリッド形式で表示されること', () => {
    const products = [
      createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440001', name: '商品A' }),
      createMockProduct({ id: '550e8400-e29b-41d4-a716-446655440002', name: '商品B' }),
    ];
    render(
      <ProductList
        products={products}
        isLoading={false}
        pagination={defaultPagination}
      />
    );

    expect(screen.getByText('商品A')).toBeDefined();
    expect(screen.getByText('商品B')).toBeDefined();
  });

  it('ローディング状態で「商品を読み込み中...」が表示されること', () => {
    render(
      <ProductList
        products={[]}
        isLoading={true}
        pagination={null}
      />
    );

    expect(screen.getByText('商品を読み込み中...')).toBeDefined();
  });

  it('エラー状態でエラーメッセージが表示されること', () => {
    render(
      <ProductList
        products={[]}
        isLoading={false}
        error="エラーが発生しました"
        pagination={null}
      />
    );

    expect(screen.getByText('エラーが発生しました')).toBeDefined();
  });

  it('商品0件で「商品がありません」が表示されること', () => {
    render(
      <ProductList
        products={[]}
        isLoading={false}
        pagination={{ page: 1, limit: 12, total: 0, totalPages: 0 }}
      />
    );

    expect(screen.getByText('商品がありません')).toBeDefined();
  });

  it('ページネーション情報が正しく表示されること', () => {
    const products = Array.from({ length: 3 }, (_, i) =>
      createMockProduct({ id: `550e8400-e29b-41d4-a716-44665544000${i}`, name: `商品${i}` })
    );
    render(
      <ProductList
        products={products}
        isLoading={false}
        pagination={{ page: 1, limit: 12, total: 15, totalPages: 2 }}
      />
    );

    expect(screen.getByText(/全15件中/)).toBeDefined();
  });

  it('前へボタンが1ページ目で無効化されること', () => {
    const products = [createMockProduct()];
    render(
      <ProductList
        products={products}
        isLoading={false}
        pagination={{ page: 1, limit: 12, total: 15, totalPages: 2 }}
      />
    );

    const prevButton = screen.getByText('前へ');
    expect(prevButton).toBeDefined();
    expect((prevButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('次へボタンが最終ページで無効化されること', () => {
    const products = [createMockProduct()];
    render(
      <ProductList
        products={products}
        isLoading={false}
        pagination={{ page: 2, limit: 12, total: 15, totalPages: 2 }}
      />
    );

    const nextButton = screen.getByText('次へ');
    expect(nextButton).toBeDefined();
    expect((nextButton as HTMLButtonElement).disabled).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// ProductDetail
// ─────────────────────────────────────────────────────────────────

describe('ProductDetail', () => {
  it('商品画像・商品名・価格・説明文・在庫数が表示されること', () => {
    const product = createMockProduct({ stock: 15 });
    render(<ProductDetail product={product} isLoading={false} />);

    expect(screen.getByAltText('テスト商品')).toBeDefined();
    expect(screen.getByText('テスト商品')).toBeDefined();
    expect(screen.getByText('¥1,000')).toBeDefined();
    expect(screen.getByText('テスト説明文です。')).toBeDefined();
    expect(screen.getByText(/15/)).toBeDefined();
  });

  it('在庫がある場合カート追加ボタンが有効であること', () => {
    const product = createMockProduct({ stock: 10 });
    const onAddToCart = vi.fn();
    render(<ProductDetail product={product} isLoading={false} onAddToCart={onAddToCart} />);

    const button = screen.getByText('カートに追加');
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it('在庫が0の場合カート追加ボタンが無効化（disabled）されていること', () => {
    const product = createMockProduct({ stock: 0 });
    const onAddToCart = vi.fn();
    render(<ProductDetail product={product} isLoading={false} onAddToCart={onAddToCart} />);

    const button = screen.getByText('カートに追加');
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('在庫0の場合「在庫切れ」テキストが表示されること', () => {
    const product = createMockProduct({ stock: 0 });
    render(<ProductDetail product={product} isLoading={false} />);

    expect(screen.getByText('在庫切れ')).toBeDefined();
  });

  it('画像未設定時プレースホルダーが表示されること', () => {
    const product = createMockProduct({ imageUrl: undefined });
    render(<ProductDetail product={product} isLoading={false} />);

    expect(screen.queryByAltText('テスト商品')).toBeNull();
  });

  it('戻るボタンが表示され onBack が呼ばれること', async () => {
    const product = createMockProduct();
    const onBack = vi.fn();
    render(<ProductDetail product={product} isLoading={false} onBack={onBack} />);

    const backButton = screen.getByText('戻る');
    expect(backButton).toBeDefined();
    await userEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// ProductList + SearchBar 統合
// ─────────────────────────────────────────────────────────────────

describe('ProductList 検索統合', () => {
  it('onSearch が設定されている場合 SearchBar が表示されること', () => {
    const products = [createMockProduct()];
    const onSearch = vi.fn();
    render(
      <ProductList
        products={products}
        isLoading={false}
        pagination={{ page: 1, limit: 12, total: 1, totalPages: 1 }}
        onSearch={onSearch}
        searchKeyword=""
      />
    );

    expect(screen.getByTestId('search-input')).toBeDefined();
  });

  it('SearchBar のクリアボタンで onSearch が空文字で呼ばれること', async () => {
    const products = [createMockProduct()];
    const onSearch = vi.fn();
    render(
      <ProductList
        products={products}
        isLoading={false}
        pagination={{ page: 1, limit: 12, total: 1, totalPages: 1 }}
        onSearch={onSearch}
        searchKeyword="テスト"
      />
    );

    const clearButton = screen.getByTestId('search-clear');
    await userEvent.click(clearButton);
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('検索結果が0件の場合「該当する商品が見つかりませんでした」が表示されること', () => {
    const onSearch = vi.fn();
    render(
      <ProductList
        products={[]}
        isLoading={false}
        pagination={{ page: 1, limit: 12, total: 0, totalPages: 0 }}
        onSearch={onSearch}
        searchKeyword="存在しない商品"
      />
    );

    expect(screen.getByText('該当する商品が見つかりませんでした')).toBeDefined();
  });
});
