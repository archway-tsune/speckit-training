/**
 * Orders ドメイン - UI 単体テスト
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
// useRouter / useSearchParams モック
// ─────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
  useParams: () => ({ id: '770e8400-e29b-41d4-a716-446655440001' }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/orders',
}));

// ─────────────────────────────────────────────────────────────────
// テストデータ
// ─────────────────────────────────────────────────────────────────

const mockCartData = {
  id: '990e8400-e29b-41d4-a716-446655440003',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  items: [
    {
      productId: '880e8400-e29b-41d4-a716-446655440002',
      productName: 'テスト商品A',
      price: 1000,
      imageUrl: 'https://example.com/a.jpg',
      quantity: 2,
      addedAt: new Date().toISOString(),
    },
    {
      productId: '880e8400-e29b-41d4-a716-446655440003',
      productName: 'テスト商品B',
      price: 2000,
      imageUrl: 'https://example.com/b.jpg',
      quantity: 1,
      addedAt: new Date().toISOString(),
    },
  ],
  subtotal: 4000,
  itemCount: 3,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockOrderData = {
  id: '770e8400-e29b-41d4-a716-446655440001',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  items: [
    {
      productId: '880e8400-e29b-41d4-a716-446655440002',
      productName: 'テスト商品A',
      price: 1000,
      quantity: 2,
    },
    {
      productId: '880e8400-e29b-41d4-a716-446655440003',
      productName: 'テスト商品B',
      price: 2000,
      quantity: 1,
    },
  ],
  totalAmount: 4000,
  status: 'pending',
  createdAt: '2026-02-09T00:00:00Z',
  updatedAt: '2026-02-09T00:00:00Z',
};

const mockOrdersListData = {
  orders: [
    mockOrderData,
    {
      ...mockOrderData,
      id: '770e8400-e29b-41d4-a716-446655440002',
      status: 'confirmed',
      createdAt: '2026-02-08T00:00:00Z',
      updatedAt: '2026-02-08T00:00:00Z',
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1,
  },
};

// ─────────────────────────────────────────────────────────────────
// US1: CheckoutView コンポーネント
// ─────────────────────────────────────────────────────────────────

describe('US1: CheckoutView — チェックアウト画面', () => {
  let CheckoutView: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/domains/orders/ui');
    CheckoutView = mod.CheckoutView;
  });

  afterEach(() => {
    cleanup();
  });

  function setupCartFetch() {
    mockFetch.mockImplementation(async (url: string) => {
      if (url === '/api/cart') {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockCartData }),
        };
      }
      return { ok: false, json: async () => ({ success: false }) };
    });
  }

  it('カート内容が表示される（商品名・単価・数量・小計・合計）', async () => {
    setupCartFetch();
    render(<CheckoutView />);

    await waitFor(() => {
      expect(screen.getByText('テスト商品A')).toBeInTheDocument();
    });

    expect(screen.getByText('テスト商品B')).toBeInTheDocument();
    // 合計金額が表示される
    expect(screen.getByText(/¥4,000/)).toBeInTheDocument();
  });

  it('「注文を確定」ボタンが表示される', async () => {
    setupCartFetch();
    render(<CheckoutView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /注文を確定/ })).toBeInTheDocument();
    });
  });

  it('「注文を確定」ボタン押下で POST /api/orders が呼ばれる', async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
      if (url === '/api/cart') {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockCartData }),
        };
      }
      if (url === '/api/orders' && options?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockOrderData }),
        };
      }
      return { ok: false, json: async () => ({ success: false }) };
    });

    render(<CheckoutView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /注文を確定/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /注文を確定/ }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/orders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ confirmed: true }),
        })
      );
    });
  });

  it('注文成功時に注文完了ページへ遷移する', async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
      if (url === '/api/cart') {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockCartData }),
        };
      }
      if (url === '/api/orders' && options?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockOrderData }),
        };
      }
      return { ok: false, json: async () => ({ success: false }) };
    });

    render(<CheckoutView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /注文を確定/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /注文を確定/ }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/order-complete?orderId=')
      );
    });
  });

  it('送信中はボタンが無効化される（二重送信防止）', async () => {
    const user = userEvent.setup();
    let resolveOrder: (value: unknown) => void;
    const orderPromise = new Promise((resolve) => {
      resolveOrder = resolve;
    });

    mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
      if (url === '/api/cart') {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockCartData }),
        };
      }
      if (url === '/api/orders' && options?.method === 'POST') {
        await orderPromise;
        return {
          ok: true,
          json: async () => ({ success: true, data: mockOrderData }),
        };
      }
      return { ok: false, json: async () => ({ success: false }) };
    });

    render(<CheckoutView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /注文を確定/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /注文を確定/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /注文を確定|処理中/ })).toBeDisabled();
    });

    resolveOrder!(undefined);
  });

  it('カートが空の場合はカートページにリダイレクトする', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url === '/api/cart') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { ...mockCartData, items: [], subtotal: 0, itemCount: 0 },
          }),
        };
      }
      return { ok: false, json: async () => ({ success: false }) };
    });

    render(<CheckoutView />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/cart');
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// US1: OrderCompletePage コンポーネント
// ─────────────────────────────────────────────────────────────────

describe('US1: OrderCompletePage — 注文完了画面', () => {
  let OrderCompletePage: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSearchParams.set('orderId', '770e8400-e29b-41d4-a716-446655440001');
    const mod = await import('@/domains/orders/ui');
    OrderCompletePage = mod.OrderCompletePage;
  });

  afterEach(() => {
    mockSearchParams.delete('orderId');
    cleanup();
  });

  it('注文 ID が表示される', () => {
    render(<OrderCompletePage />);
    expect(screen.getByText(/770e8400/)).toBeInTheDocument();
  });

  it('お礼メッセージ「ご注文ありがとうございます」が表示される', () => {
    render(<OrderCompletePage />);
    expect(screen.getByText(/ご注文ありがとうございます/)).toBeInTheDocument();
  });

  it('商品一覧へのリンクが表示される', () => {
    render(<OrderCompletePage />);
    const link = screen.getByRole('link', { name: /商品一覧/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/catalog');
  });
});

// ─────────────────────────────────────────────────────────────────
// US1: カートページ「注文手続きへ」ボタン
// ─────────────────────────────────────────────────────────────────

describe('US1: カートページ — 「注文手続きへ」ボタン', () => {
  let CartView: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/domains/cart/ui');
    CartView = mod.CartView;
  });

  afterEach(() => {
    cleanup();
  });

  it('カートに商品がある場合「注文手続きへ」ボタンが表示される', async () => {
    mockFetch.mockImplementation(async () => ({
      ok: true,
      json: async () => ({ success: true, data: mockCartData }),
    }));

    render(<CartView />);

    await waitFor(() => {
      expect(screen.getByText('テスト商品A')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /注文手続きへ/ })).toBeInTheDocument();
  });

  it('カートが空の場合「注文手続きへ」ボタンは非表示', async () => {
    mockFetch.mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: { ...mockCartData, items: [], subtotal: 0, itemCount: 0 },
      }),
    }));

    render(<CartView />);

    await waitFor(() => {
      expect(screen.getByText('カートに商品がありません')).toBeInTheDocument();
    });

    expect(screen.queryByRole('link', { name: /注文手続きへ/ })).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────
// US2: OrderList コンポーネント
// ─────────────────────────────────────────────────────────────────

describe('US2: OrderList — 注文一覧', () => {
  let OrderList: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/domains/orders/ui');
    OrderList = mod.OrderList;
  });

  afterEach(() => {
    cleanup();
  });

  function setupOrdersFetch(data = mockOrdersListData) {
    mockFetch.mockImplementation(async () => ({
      ok: true,
      json: async () => ({ success: true, data }),
    }));
  }

  it('注文一覧が表示される（ID先頭8桁・注文日・商品数・合計金額・ステータスバッジ）', async () => {
    setupOrdersFetch();
    render(<OrderList />);

    await waitFor(() => {
      expect(screen.getAllByText(/770e8400/).length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getAllByText(/¥4,000/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/保留中/)).toBeInTheDocument();
    expect(screen.getByText(/確認済み/)).toBeInTheDocument();
  });

  it('空状態メッセージ「注文履歴がありません」が表示される', async () => {
    mockFetch.mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: { orders: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      }),
    }));

    render(<OrderList />);

    await waitFor(() => {
      expect(screen.getByText('注文履歴がありません')).toBeInTheDocument();
    });
  });

  it('ローディング状態が表示される', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<OrderList />);
    expect(screen.getByText(/読み込み中/)).toBeInTheDocument();
  });

  it('エラー状態が表示される', async () => {
    mockFetch.mockImplementation(async () => ({
      ok: false,
      json: async () => ({ success: false, message: 'エラー' }),
    }));

    render(<OrderList />);

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました/)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// US2: OrderDetail コンポーネント
// ─────────────────────────────────────────────────────────────────

describe('US2: OrderDetail — 注文詳細', () => {
  let OrderDetail: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/domains/orders/ui');
    OrderDetail = mod.OrderDetail;
  });

  afterEach(() => {
    cleanup();
  });

  function setupOrderDetailFetch() {
    mockFetch.mockImplementation(async () => ({
      ok: true,
      json: async () => ({ success: true, data: mockOrderData }),
    }));
  }

  it('注文 ID・注文日時・ステータス・商品一覧・合計金額が表示される', async () => {
    setupOrderDetailFetch();
    render(<OrderDetail />);

    await waitFor(() => {
      expect(screen.getByText(/770e8400-e29b-41d4-a716-446655440001/)).toBeInTheDocument();
    });

    expect(screen.getByText('テスト商品A')).toBeInTheDocument();
    expect(screen.getByText('テスト商品B')).toBeInTheDocument();
    expect(screen.getByText(/保留中/)).toBeInTheDocument();
    expect(screen.getByText(/¥4,000/)).toBeInTheDocument();
  });

  it('戻るボタンが表示される', async () => {
    setupOrderDetailFetch();
    render(<OrderDetail />);

    await waitFor(() => {
      expect(screen.getByText(/注文一覧に戻る/)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// US3: AdminOrderList コンポーネント
// ─────────────────────────────────────────────────────────────────

describe('US3: AdminOrderList — 管理者注文一覧', () => {
  let AdminOrderList: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/domains/orders/ui/admin');
    AdminOrderList = mod.AdminOrderList;
  });

  afterEach(() => {
    cleanup();
  });

  function setupAdminOrdersFetch(data = mockOrdersListData) {
    mockFetch.mockImplementation(async () => ({
      ok: true,
      json: async () => ({ success: true, data }),
    }));
  }

  it('全注文が表示される', async () => {
    setupAdminOrdersFetch();
    render(<AdminOrderList />);

    await waitFor(() => {
      expect(screen.getAllByText(/770e8400/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('ステータスフィルタードロップダウンが表示される', async () => {
    setupAdminOrdersFetch();
    render(<AdminOrderList />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  it('ステータスで絞り込みができる', async () => {
    const user = userEvent.setup();
    setupAdminOrdersFetch();
    render(<AdminOrderList />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByRole('combobox'), 'pending');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=pending')
      );
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// US4: AdminOrderDetail コンポーネント
// ─────────────────────────────────────────────────────────────────

describe('US4: AdminOrderDetail — 管理者注文詳細', () => {
  let AdminOrderDetail: React.ComponentType;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/domains/orders/ui/admin');
    AdminOrderDetail = mod.AdminOrderDetail;
  });

  afterEach(() => {
    cleanup();
  });

  function setupAdminOrderDetailFetch(order = mockOrderData) {
    mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
      if (typeof url === 'string' && url.includes('/api/orders/') && !options?.method) {
        return {
          ok: true,
          json: async () => ({ success: true, data: order }),
        };
      }
      if (options?.method === 'PATCH') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { ...order, status: 'confirmed', updatedAt: new Date().toISOString() },
          }),
        };
      }
      return { ok: false, json: async () => ({ success: false }) };
    });
  }

  it('注文詳細情報が表示される', async () => {
    setupAdminOrderDetailFetch();
    render(<AdminOrderDetail />);

    await waitFor(() => {
      expect(screen.getByText(/770e8400-e29b-41d4-a716-446655440001/)).toBeInTheDocument();
    });

    expect(screen.getByText('テスト商品A')).toBeInTheDocument();
    expect(screen.getByText(/¥4,000/)).toBeInTheDocument();
  });

  it('遷移可能なステータスボタンが表示される（pendingの場合: 確認済み, キャンセル）', async () => {
    setupAdminOrderDetailFetch();
    render(<AdminOrderDetail />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /確認済み/ })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /キャンセル/ })).toBeInTheDocument();
  });

  it('ステータス更新ボタン押下で PATCH /api/orders/:id/status が呼ばれる', async () => {
    const user = userEvent.setup();
    setupAdminOrderDetailFetch();
    render(<AdminOrderDetail />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /確認済み/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /確認済み/ }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders/'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'confirmed' }),
        })
      );
    });
  });

  it('配送完了状態ではステータス変更ボタンが非表示', async () => {
    setupAdminOrderDetailFetch({ ...mockOrderData, status: 'delivered' });
    render(<AdminOrderDetail />);

    await waitFor(() => {
      expect(screen.getByText(/770e8400/)).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /確認済み/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /キャンセル/ })).not.toBeInTheDocument();
  });

  it('キャンセル状態ではステータス変更ボタンが非表示', async () => {
    setupAdminOrderDetailFetch({ ...mockOrderData, status: 'cancelled' });
    render(<AdminOrderDetail />);

    await waitFor(() => {
      expect(screen.getByText(/770e8400/)).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /確認済み/ })).not.toBeInTheDocument();
  });
});
