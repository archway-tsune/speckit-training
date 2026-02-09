/**
 * Cart ドメイン - UI単体テスト
 * TDD Red フェーズ: テストを先に書き、失敗を確認してから実装に着手する
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ─────────────────────────────────────────────────────────────────
// fetch モック
// ─────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ─────────────────────────────────────────────────────────────────
// useRouter / useParams モック
// ─────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockParams: { id?: string } = { id: '550e8400-e29b-41d4-a716-446655440001' };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
  usePathname: () => '/catalog/550e8400-e29b-41d4-a716-446655440001',
}));

// ─────────────────────────────────────────────────────────────────
// US1: 商品詳細ページ — カートに追加
// ─────────────────────────────────────────────────────────────────

describe('US1: 商品詳細ページ — カートに追加', () => {
  let ProductDetailPage: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    // 動的インポートでモジュールキャッシュをリセット
    const mod = await import('@/app/(buyer)/catalog/[id]/page');
    ProductDetailPage = mod.default;
  });

  afterEach(() => {
    cleanup();
  });

  const mockProduct = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'テスト商品A',
    price: 1500,
    stock: 10,
    description: 'テスト説明',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  function setupProductFetch(product = mockProduct) {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/catalog/products/')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: product }),
        };
      }
      if (url.includes('/api/cart')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: { itemCount: 0, items: [], subtotal: 0 } }),
        };
      }
      if (url.includes('/api/auth/session')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: { userId: 'user1', role: 'buyer', name: 'Test User' } }),
        };
      }
      return { ok: false, json: async () => ({}) };
    });
  }

  describe('Given: 在庫ありの商品', () => {
    it('Then: 「カートに追加」ボタンが表示される', async () => {
      setupProductFetch();
      render(<ProductDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'カートに追加' })).toBeInTheDocument();
      });
    });

    it('Then: ボタンが有効（disabled でない）である', async () => {
      setupProductFetch();
      render(<ProductDetailPage />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: 'カートに追加' });
        expect(button).not.toBeDisabled();
      });
    });

    it('Then: クリック時に POST /api/cart/items を呼び出す', async () => {
      setupProductFetch();
      render(<ProductDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'カートに追加' })).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'カートに追加' }));

      await waitFor(() => {
        const postCalls = mockFetch.mock.calls.filter(
          (call: [string, RequestInit?]) =>
            call[0] === '/api/cart/items' &&
            call[1]?.method === 'POST'
        );
        expect(postCalls).toHaveLength(1);
      });
    });

    it('Then: 追加成功時にフィードバックメッセージを表示する', async () => {
      setupProductFetch();

      // POST /api/cart/items の成功レスポンスを追加
      mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
        if (url === '/api/cart/items' && options?.method === 'POST') {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: {
                id: 'cart1',
                userId: 'user1',
                items: [{ productId: mockProduct.id, productName: mockProduct.name, price: mockProduct.price, quantity: 1, addedAt: new Date().toISOString() }],
                subtotal: 1500,
                itemCount: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            }),
          };
        }
        if (url.includes('/api/catalog/products/')) {
          return {
            ok: true,
            json: async () => ({ success: true, data: mockProduct }),
          };
        }
        if (url.includes('/api/cart')) {
          return {
            ok: true,
            json: async () => ({ success: true, data: { itemCount: 0, items: [], subtotal: 0 } }),
          };
        }
        if (url.includes('/api/auth/session')) {
          return {
            ok: true,
            json: async () => ({ success: true, data: { userId: 'user1', role: 'buyer', name: 'Test User' } }),
          };
        }
        return { ok: false, json: async () => ({}) };
      });

      render(<ProductDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'カートに追加' })).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'カートに追加' }));

      await waitFor(() => {
        expect(screen.getByText(/カートに追加しました/)).toBeInTheDocument();
      });
    });

    it('Then: 送信中はボタンが disabled になる（二重送信防止）', async () => {
      setupProductFetch();

      // POST を遅延させる
      let resolvePost: (value: unknown) => void;
      mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
        if (url === '/api/cart/items' && options?.method === 'POST') {
          return new Promise((resolve) => {
            resolvePost = resolve;
          });
        }
        if (url.includes('/api/catalog/products/')) {
          return {
            ok: true,
            json: async () => ({ success: true, data: mockProduct }),
          };
        }
        if (url.includes('/api/cart')) {
          return {
            ok: true,
            json: async () => ({ success: true, data: { itemCount: 0, items: [], subtotal: 0 } }),
          };
        }
        if (url.includes('/api/auth/session')) {
          return {
            ok: true,
            json: async () => ({ success: true, data: { userId: 'user1', role: 'buyer', name: 'Test User' } }),
          };
        }
        return { ok: false, json: async () => ({}) };
      });

      render(<ProductDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'カートに追加' })).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'カートに追加' }));

      // 送信中はボタンが disabled
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const addButton = buttons.find(
          (b) => b.textContent?.includes('追加中') || b.textContent?.includes('カートに追加')
        );
        expect(addButton).toBeDisabled();
      });

      // 解決してクリーンアップ
      resolvePost!({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: 'cart1', userId: 'user1', items: [], subtotal: 0, itemCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        }),
      });
    });

    it('Then: 追加成功時に cart-updated イベントを発火する', async () => {
      setupProductFetch();

      mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
        if (url === '/api/cart/items' && options?.method === 'POST') {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: { id: 'cart1', userId: 'user1', items: [{ productId: mockProduct.id, productName: mockProduct.name, price: mockProduct.price, quantity: 1, addedAt: new Date().toISOString() }], subtotal: 1500, itemCount: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            }),
          };
        }
        if (url.includes('/api/catalog/products/')) {
          return { ok: true, json: async () => ({ success: true, data: mockProduct }) };
        }
        if (url.includes('/api/cart')) {
          return { ok: true, json: async () => ({ success: true, data: { itemCount: 0, items: [], subtotal: 0 } }) };
        }
        if (url.includes('/api/auth/session')) {
          return { ok: true, json: async () => ({ success: true, data: { userId: 'user1', role: 'buyer', name: 'Test User' } }) };
        }
        return { ok: false, json: async () => ({}) };
      });

      const eventHandler = vi.fn();
      window.addEventListener('cart-updated', eventHandler);

      render(<ProductDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'カートに追加' })).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'カートに追加' }));

      await waitFor(() => {
        expect(eventHandler).toHaveBeenCalled();
      });

      window.removeEventListener('cart-updated', eventHandler);
    });
  });

  describe('Given: 在庫切れの商品（stock === 0）', () => {
    it('Then: 「カートに追加」ボタンが disabled になる', async () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 };
      setupProductFetch(outOfStockProduct);

      // 在庫切れの場合でもフェッチが反映されるよう再設定
      mockFetch.mockImplementation(async (url: string) => {
        if (url.includes('/api/catalog/products/')) {
          return {
            ok: true,
            json: async () => ({ success: true, data: outOfStockProduct }),
          };
        }
        if (url.includes('/api/cart')) {
          return {
            ok: true,
            json: async () => ({ success: true, data: { itemCount: 0, items: [], subtotal: 0 } }),
          };
        }
        if (url.includes('/api/auth/session')) {
          return {
            ok: true,
            json: async () => ({ success: true, data: { userId: 'user1', role: 'buyer', name: 'Test User' } }),
          };
        }
        return { ok: false, json: async () => ({}) };
      });

      render(<ProductDetailPage />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: 'カートに追加' });
        expect(button).toBeDisabled();
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// 共通ヘルパー
// ─────────────────────────────────────────────────────────────────

const mockCartItem1 = {
  productId: '550e8400-e29b-41d4-a716-446655440001',
  productName: 'テスト商品A',
  price: 1000,
  quantity: 2,
  addedAt: new Date().toISOString(),
};

const mockCartItem2 = {
  productId: '550e8400-e29b-41d4-a716-446655440002',
  productName: 'テスト商品B',
  price: 2000,
  quantity: 1,
  addedAt: new Date().toISOString(),
};

const mockCartData = {
  id: 'cart1',
  userId: 'user1',
  items: [mockCartItem1, mockCartItem2],
  subtotal: 4000,
  itemCount: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function setupCartFetchGlobal(cartData = mockCartData) {
  mockFetch.mockImplementation(async (url: string) => {
    if (url === '/api/cart') {
      return {
        ok: true,
        json: async () => ({ success: true, data: cartData }),
      };
    }
    return { ok: false, json: async () => ({}) };
  });
}

// ─────────────────────────────────────────────────────────────────
// US2: カート内容を確認する
// ─────────────────────────────────────────────────────────────────

describe('US2: CartView — カート内容を確認する', () => {
  let CartView: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/domains/cart/ui');
    CartView = mod.CartView;
  });

  afterEach(() => {
    cleanup();
  });

  describe('Given: カート内に商品あり', () => {
    it('Then: 商品一覧（商品名・単価・数量・小計）を表示する', async () => {
      setupCartFetchGlobal();
      render(<CartView />);

      await waitFor(() => {
        expect(screen.getByText('テスト商品A')).toBeInTheDocument();
        expect(screen.getByText('テスト商品B')).toBeInTheDocument();
      });

      // 小計が表示される（商品A: 1000 x 2 = 2000, 商品B: 2000 x 1 = 2000）
      const subtotals = screen.getAllByTestId('item-subtotal');
      expect(subtotals).toHaveLength(2);
      expect(subtotals[0]).toHaveTextContent('¥2,000');
      expect(subtotals[1]).toHaveTextContent('¥2,000');
    });

    it('Then: 金額明細（商品合計・消費税・総合計）を表示する', async () => {
      setupCartFetchGlobal();
      render(<CartView />);

      await waitFor(() => {
        expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('¥4,000');
      });

      // 消費税: Math.floor(4000 * 0.1) = 400
      expect(screen.getByTestId('cart-tax')).toHaveTextContent('¥400');

      // 総合計: 4000 + 400 = 4400
      expect(screen.getByTestId('cart-total')).toHaveTextContent('¥4,400');
    });
  });

  describe('Given: カートが空', () => {
    it('Then: 「カートに商品がありません」メッセージを表示する', async () => {
      setupCartFetchGlobal({ ...mockCartData, items: [], subtotal: 0, itemCount: 0 });
      render(<CartView />);

      await waitFor(() => {
        expect(screen.getByText(/カートに商品がありません/)).toBeInTheDocument();
      });
    });

    it('Then: 商品一覧ページへのリンクを表示する', async () => {
      setupCartFetchGlobal({ ...mockCartData, items: [], subtotal: 0, itemCount: 0 });
      render(<CartView />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /商品一覧/ })).toHaveAttribute('href', '/catalog');
      });
    });
  });

  describe('Given: ローディング中', () => {
    it('Then: ローディング表示を出す', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      render(<CartView />);

      expect(screen.getByRole('status', { name: /読み込み中/i })).toBeInTheDocument();
    });
  });

  describe('Given: API エラー', () => {
    it('Then: エラー表示を出す', async () => {
      mockFetch.mockImplementation(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ success: false, message: 'Internal Server Error' }),
      }));
      render(<CartView />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// US3: カート内の数量を変更する
// ─────────────────────────────────────────────────────────────────

describe('US3: CartView — 数量変更', () => {
  let CartView: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/domains/cart/ui');
    CartView = mod.CartView;
  });

  afterEach(() => {
    cleanup();
  });

  describe('Given: カート内に商品あり', () => {
    it('Then: 数量表示と+/-ボタンが表示される', async () => {
      setupCartFetchGlobal();
      render(<CartView />);

      await waitFor(() => {
        // 各商品に+/-ボタンがある
        expect(screen.getByRole('button', { name: /テスト商品Aの数量を増やす/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /テスト商品Aの数量を減らす/ })).toBeInTheDocument();
        // 数量が表示される
        expect(screen.getByText('2', { selector: '[aria-label="テスト商品Aの数量"]' })).toBeInTheDocument();
        expect(screen.getByText('1', { selector: '[aria-label="テスト商品Bの数量"]' })).toBeInTheDocument();
      });
    });

    it('Then: +ボタンクリック時に PUT /api/cart/items/:productId を呼び出す', async () => {
      const updatedCart = {
        ...mockCartData,
        items: [
          { ...mockCartItem1, quantity: 3 },
          mockCartItem2,
        ],
        subtotal: 5000,
        itemCount: 4,
      };

      mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
        if (url === '/api/cart') {
          return { ok: true, json: async () => ({ success: true, data: mockCartData }) };
        }
        if (url.includes('/api/cart/items/') && options?.method === 'PUT') {
          return { ok: true, json: async () => ({ success: true, data: updatedCart }) };
        }
        return { ok: false, json: async () => ({}) };
      });

      render(<CartView />);

      await waitFor(() => {
        expect(screen.getByText('テスト商品A')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /テスト商品Aの数量を増やす/ }));

      await waitFor(() => {
        const putCalls = mockFetch.mock.calls.filter(
          (call: [string, RequestInit?]) =>
            call[0].includes('/api/cart/items/') &&
            call[1]?.method === 'PUT'
        );
        expect(putCalls).toHaveLength(1);
        expect(putCalls[0][0]).toContain(mockCartItem1.productId);
        // quantity 2 → 3
        const body = JSON.parse(putCalls[0][1]?.body as string);
        expect(body.quantity).toBe(3);
      });
    });

    it('Then: +ボタンで数量増加後、小計・合計が即時更新される', async () => {
      const updatedCart = {
        ...mockCartData,
        items: [
          { ...mockCartItem1, quantity: 3 },
          mockCartItem2,
        ],
        subtotal: 5000,
        itemCount: 4,
      };

      mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
        if (url === '/api/cart') {
          return { ok: true, json: async () => ({ success: true, data: mockCartData }) };
        }
        if (url.includes('/api/cart/items/') && options?.method === 'PUT') {
          return { ok: true, json: async () => ({ success: true, data: updatedCart }) };
        }
        return { ok: false, json: async () => ({}) };
      });

      render(<CartView />);

      await waitFor(() => {
        expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('¥4,000');
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /テスト商品Aの数量を増やす/ }));

      await waitFor(() => {
        // 更新後: 商品合計 5000, 消費税 500, 総合計 5500
        expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('¥5,000');
        expect(screen.getByTestId('cart-tax')).toHaveTextContent('¥500');
        expect(screen.getByTestId('cart-total')).toHaveTextContent('¥5,500');
      });
    });

    it('Then: 在庫超過時にエラーメッセージ「在庫数を超えています」を表示する', async () => {
      mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
        if (url === '/api/cart') {
          return { ok: true, json: async () => ({ success: true, data: mockCartData }) };
        }
        if (url.includes('/api/cart/items/') && options?.method === 'PUT') {
          return {
            ok: false,
            status: 400,
            json: async () => ({
              success: false,
              code: 'VALIDATION_ERROR',
              message: 'バリデーションエラー',
              details: [{ field: 'quantity', message: '在庫数を超えています' }],
            }),
          };
        }
        return { ok: false, json: async () => ({}) };
      });

      render(<CartView />);

      await waitFor(() => {
        expect(screen.getByText('テスト商品A')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /テスト商品Aの数量を増やす/ }));

      await waitFor(() => {
        expect(screen.getByText('在庫数を超えています')).toBeInTheDocument();
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// US4: カートから商品を削除する
// ─────────────────────────────────────────────────────────────────

describe('US4: CartView — 商品削除（ConfirmDialog）', () => {
  let CartView: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/domains/cart/ui');
    CartView = mod.CartView;
  });

  afterEach(() => {
    cleanup();
  });

  describe('Given: カート内に商品あり', () => {
    it('Then: 削除ボタンクリックで確認ダイアログを表示する', async () => {
      setupCartFetchGlobal();
      render(<CartView />);

      await waitFor(() => {
        expect(screen.getByText('テスト商品A')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /テスト商品Aを削除/ }));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
        expect(screen.getByText(/カートから削除しますか/)).toBeInTheDocument();
      });
    });

    it('Then: 「削除する」選択時に DELETE API を呼び出す', async () => {
      const emptyCart = { ...mockCartData, items: [], subtotal: 0, itemCount: 0 };

      mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
        if (url === '/api/cart') {
          return { ok: true, json: async () => ({ success: true, data: mockCartData }) };
        }
        if (url.includes('/api/cart/items/') && options?.method === 'DELETE') {
          return { ok: true, json: async () => ({ success: true, data: emptyCart }) };
        }
        return { ok: false, json: async () => ({}) };
      });

      render(<CartView />);

      await waitFor(() => {
        expect(screen.getByText('テスト商品A')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /テスト商品Aを削除/ }));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('confirm-button'));

      await waitFor(() => {
        const deleteCalls = mockFetch.mock.calls.filter(
          (call: [string, RequestInit?]) =>
            call[0].includes('/api/cart/items/') &&
            call[1]?.method === 'DELETE'
        );
        expect(deleteCalls).toHaveLength(1);
      });
    });

    it('Then: 「キャンセル」選択時に状態が変わらない', async () => {
      setupCartFetchGlobal();
      render(<CartView />);

      await waitFor(() => {
        expect(screen.getByText('テスト商品A')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /テスト商品Aを削除/ }));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('cancel-button'));

      // ダイアログが閉じる
      await waitFor(() => {
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      });

      // 商品はまだ表示されている
      expect(screen.getByText('テスト商品A')).toBeInTheDocument();
      expect(screen.getByText('テスト商品B')).toBeInTheDocument();
    });

    it('Then: 最後の商品削除で空カートメッセージを表示する', async () => {
      const singleItemCart = {
        ...mockCartData,
        items: [mockCartItem1],
        subtotal: 2000,
        itemCount: 2,
      };
      const emptyCart = { ...mockCartData, items: [], subtotal: 0, itemCount: 0 };

      mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
        if (url === '/api/cart') {
          return { ok: true, json: async () => ({ success: true, data: singleItemCart }) };
        }
        if (url.includes('/api/cart/items/') && options?.method === 'DELETE') {
          return { ok: true, json: async () => ({ success: true, data: emptyCart }) };
        }
        return { ok: false, json: async () => ({}) };
      });

      render(<CartView />);

      await waitFor(() => {
        expect(screen.getByText('テスト商品A')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /テスト商品Aを削除/ }));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('confirm-button'));

      await waitFor(() => {
        expect(screen.getByText(/カートに商品がありません/)).toBeInTheDocument();
      });
    });
  });
});
