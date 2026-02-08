/**
 * Catalog ドメイン - UI単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductList } from '@/samples/domains/catalog/ui/ProductList';
import { ProductDetail } from '@/samples/domains/catalog/ui/ProductDetail';
import { ProductCard } from '@/samples/domains/catalog/ui/ProductCard';
import type { Product } from '@/contracts/catalog';

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'テスト商品',
    price: 1000,
    description: '商品の説明文です。',
    imageUrl: 'https://example.com/image.jpg',
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
  describe('Given: 商品データ', () => {
    describe('When: カードを表示する', () => {
      it('Then: 商品名・価格・画像を表示する', () => {
        const product = createMockProduct();
        render(<ProductCard product={product} />);

        expect(screen.getByText('テスト商品')).toBeInTheDocument();
        expect(screen.getByText('¥1,000')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', product.imageUrl);
      });

      it('Then: 商品詳細へのリンクを持つ', () => {
        const product = createMockProduct();
        render(<ProductCard product={product} />);

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', `/catalog/${product.id}`);
      });
    });

    describe('When: 画像がない商品を表示する', () => {
      it('Then: プレースホルダー画像を表示する', () => {
        const product = createMockProduct({ imageUrl: undefined });
        render(<ProductCard product={product} />);

        expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument();
      });
    });
  });

  describe('Given: カートに追加ボタン', () => {
    describe('When: ボタンをクリックする', () => {
      it('Then: onAddToCartコールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onAddToCart = vi.fn();
        const product = createMockProduct();

        render(<ProductCard product={product} onAddToCart={onAddToCart} />);

        await user.click(screen.getByRole('button', { name: /カートに追加/i }));
        expect(onAddToCart).toHaveBeenCalledWith(product.id);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// ProductList
// ─────────────────────────────────────────────────────────────────

describe('ProductList', () => {
  describe('Given: loading状態', () => {
    describe('When: リストを表示する', () => {
      it('Then: ローディング表示を出す', () => {
        render(<ProductList products={[]} isLoading={true} pagination={null} />);

        expect(screen.getByRole('status', { name: /読み込み中/i })).toBeInTheDocument();
      });
    });
  });

  describe('Given: error状態', () => {
    describe('When: リストを表示する', () => {
      it('Then: エラー表示を出す', () => {
        render(
          <ProductList
            products={[]}
            isLoading={false}
            error="商品の取得に失敗しました"
            pagination={null}
          />
        );

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('商品の取得に失敗しました')).toBeInTheDocument();
      });

      it('Then: リトライボタンを表示する', async () => {
        const user = userEvent.setup();
        const onRetry = vi.fn();

        render(
          <ProductList
            products={[]}
            isLoading={false}
            error="エラー"
            onRetry={onRetry}
            pagination={null}
          />
        );

        await user.click(screen.getByRole('button', { name: /再試行/i }));
        expect(onRetry).toHaveBeenCalled();
      });
    });
  });

  describe('Given: empty状態', () => {
    describe('When: 商品がない', () => {
      it('Then: 空状態表示を出す', () => {
        render(<ProductList products={[]} isLoading={false} pagination={null} />);

        expect(screen.getByRole('status', { name: /データなし/i })).toBeInTheDocument();
        expect(screen.getByText(/商品がありません/i)).toBeInTheDocument();
      });
    });
  });

  describe('Given: 商品データあり', () => {
    describe('When: リストを表示する', () => {
      it('Then: 商品カードを一覧表示する', () => {
        const products = [
          createMockProduct({ id: '1', name: '商品A' }),
          createMockProduct({ id: '2', name: '商品B' }),
          createMockProduct({ id: '3', name: '商品C' }),
        ];
        const pagination = { page: 1, limit: 20, total: 3, totalPages: 1 };

        render(
          <ProductList products={products} isLoading={false} pagination={pagination} />
        );

        expect(screen.getByText('商品A')).toBeInTheDocument();
        expect(screen.getByText('商品B')).toBeInTheDocument();
        expect(screen.getByText('商品C')).toBeInTheDocument();
      });
    });

    describe('When: ページネーションがある', () => {
      it('Then: ページネーション情報を表示する', () => {
        const products = [createMockProduct()];
        const pagination = { page: 1, limit: 20, total: 100, totalPages: 5 };

        render(
          <ProductList products={products} isLoading={false} pagination={pagination} />
        );

        expect(screen.getByText(/全100件/)).toBeInTheDocument();
      });

      it('Then: 次ページボタンが動作する', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();
        const products = [createMockProduct()];
        const pagination = { page: 1, limit: 20, total: 100, totalPages: 5 };

        render(
          <ProductList
            products={products}
            isLoading={false}
            pagination={pagination}
            onPageChange={onPageChange}
          />
        );

        await user.click(screen.getByRole('button', { name: /次へ/i }));
        expect(onPageChange).toHaveBeenCalledWith(2);
      });

      it('Then: 最終ページでは次へボタンが無効', () => {
        const products = [createMockProduct()];
        const pagination = { page: 5, limit: 20, total: 100, totalPages: 5 };

        render(
          <ProductList products={products} isLoading={false} pagination={pagination} />
        );

        expect(screen.getByRole('button', { name: /次へ/i })).toBeDisabled();
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// ProductDetail
// ─────────────────────────────────────────────────────────────────

describe('ProductDetail', () => {
  describe('Given: loading状態', () => {
    describe('When: 詳細を表示する', () => {
      it('Then: ローディング表示を出す', () => {
        render(<ProductDetail product={null} isLoading={true} />);

        expect(screen.getByRole('status', { name: /読み込み中/i })).toBeInTheDocument();
      });
    });
  });

  describe('Given: error状態', () => {
    describe('When: 詳細を表示する', () => {
      it('Then: エラー表示を出す', () => {
        render(<ProductDetail product={null} isLoading={false} error="商品が見つかりません" />);

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('商品が見つかりません')).toBeInTheDocument();
      });
    });
  });

  describe('Given: 商品データあり', () => {
    describe('When: 詳細を表示する', () => {
      it('Then: 商品情報を全て表示する', () => {
        const product = createMockProduct();
        render(<ProductDetail product={product} isLoading={false} />);

        expect(screen.getByRole('heading', { name: 'テスト商品' })).toBeInTheDocument();
        expect(screen.getByText('¥1,000')).toBeInTheDocument();
        expect(screen.getByText('商品の説明文です。')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', product.imageUrl);
      });
    });

    describe('When: カートに追加ボタンをクリックする', () => {
      it('Then: onAddToCartコールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onAddToCart = vi.fn();
        const product = createMockProduct();

        render(
          <ProductDetail product={product} isLoading={false} onAddToCart={onAddToCart} />
        );

        await user.click(screen.getByRole('button', { name: /カートに追加/i }));
        expect(onAddToCart).toHaveBeenCalledWith(product.id);
      });
    });

    describe('When: 戻るボタンをクリックする', () => {
      it('Then: onBackコールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onBack = vi.fn();
        const product = createMockProduct();

        render(<ProductDetail product={product} isLoading={false} onBack={onBack} />);

        await user.click(screen.getByRole('button', { name: /戻る/i }));
        expect(onBack).toHaveBeenCalled();
      });
    });
  });
});
