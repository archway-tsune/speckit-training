/**
 * Product ドメイン - UI コンポーネント単体テスト
 * TDD Red フェーズ: テストを先に書き、失敗を確認してから実装に着手する
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─────────────────────────────────────────────────────────────────
// モック
// ─────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: '550e8400-e29b-41d4-a716-446655440001' }),
}));

// fetch モック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

function createProductResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'テスト商品A',
    price: 1500,
    stock: 10,
    status: 'draft',
    description: 'テスト説明',
    imageUrl: 'https://example.com/image.jpg',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function createListResponse(count: number = 3, page: number = 1, total?: number) {
  const products = Array.from({ length: count }, (_, i) =>
    createProductResponse({
      id: `550e8400-e29b-41d4-a716-44665544000${i}`,
      name: `テスト商品${String.fromCharCode(65 + i)}`,
      price: 1000 * (i + 1),
      status: i === 0 ? 'draft' : i === 1 ? 'published' : 'archived',
    })
  );
  return {
    success: true,
    data: {
      products,
      pagination: {
        page,
        limit: 20,
        total: total ?? count,
        totalPages: Math.ceil((total ?? count) / 20),
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// T013: AdminProductList コンポーネント
// ─────────────────────────────────────────────────────────────────

describe('AdminProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockPush.mockReset();
  });

  it('商品一覧をテーブル形式で表示する', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createListResponse(3)),
    });

    const { AdminProductList } = await import('@/domains/product/ui');
    render(<AdminProductList />);

    await waitFor(() => {
      expect(screen.getByText('テスト商品A')).toBeInTheDocument();
    });

    expect(screen.getByText('テスト商品B')).toBeInTheDocument();
    expect(screen.getByText('テスト商品C')).toBeInTheDocument();
  });

  it('商品名・価格・在庫数・ステータス列がある', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createListResponse(1)),
    });

    const { AdminProductList } = await import('@/domains/product/ui');
    render(<AdminProductList />);

    await waitFor(() => {
      expect(screen.getByText('テスト商品A')).toBeInTheDocument();
    });

    // テーブルヘッダーに在庫数列がある
    expect(screen.getByText('在庫数')).toBeInTheDocument();

    // 価格表示
    expect(screen.getByText(/1,000/)).toBeInTheDocument();

    // 在庫数表示（stock: 10）
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('商品が0件の場合に「商品がありません」メッセージを表示する', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createListResponse(0)),
    });

    const { AdminProductList } = await import('@/domains/product/ui');
    render(<AdminProductList />);

    await waitFor(() => {
      expect(screen.getByText('商品がありません')).toBeInTheDocument();
    });
  });

  it('編集ボタンをクリックすると編集ページに遷移する', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createListResponse(1)),
    });

    const { AdminProductList } = await import('@/domains/product/ui');
    render(<AdminProductList />);

    await waitFor(() => {
      expect(screen.getByText('テスト商品A')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('link', { name: '編集' });
    expect(editButton).toHaveAttribute('href', '/admin/products/550e8400-e29b-41d4-a716-446655440000/edit');
  });

  it('新規登録ボタンが表示される', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createListResponse(1)),
    });

    const { AdminProductList } = await import('@/domains/product/ui');
    render(<AdminProductList />);

    await waitFor(() => {
      expect(screen.getByText('テスト商品A')).toBeInTheDocument();
    });

    const newButton = screen.getByRole('link', { name: '新規登録' });
    expect(newButton).toHaveAttribute('href', '/admin/products/new');
  });

  it('ステータス変更ドロップダウンからステータスを変更できる', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createListResponse(1)),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: createProductResponse({ status: 'published' }) }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createListResponse(1)),
      });

    const { AdminProductList } = await import('@/domains/product/ui');
    render(<AdminProductList />);

    await waitFor(() => {
      expect(screen.getByText('テスト商品A')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'published');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/products/550e8400-e29b-41d4-a716-446655440000/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'published' }),
        })
      );
    });
  });

  it('ページネーションが表示される（21件以上の場合）', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createListResponse(20, 1, 25)),
    });

    const { AdminProductList } = await import('@/domains/product/ui');
    render(<AdminProductList />);

    await waitFor(() => {
      expect(screen.getByText(/全 25 件/)).toBeInTheDocument();
    });
  });

  it('削除ボタンをクリックすると確認ダイアログが表示される', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createListResponse(1)),
    });

    const { AdminProductList } = await import('@/domains/product/ui');
    render(<AdminProductList />);

    await waitFor(() => {
      expect(screen.getByText('テスト商品A')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: '削除' });
    await userEvent.click(deleteButton);

    expect(screen.getByText(/テスト商品A.*を削除しますか/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '削除する' })).toBeInTheDocument();
  });

  it('確認ダイアログで「削除する」を選択すると削除される', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createListResponse(1)),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { success: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createListResponse(0)),
      });

    const { AdminProductList } = await import('@/domains/product/ui');
    render(<AdminProductList />);

    await waitFor(() => {
      expect(screen.getByText('テスト商品A')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: '削除' }));
    await userEvent.click(screen.getByRole('button', { name: '削除する' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/products/550e8400-e29b-41d4-a716-446655440000',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('確認ダイアログで「キャンセル」を選択すると削除されない', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createListResponse(1)),
    });

    const { AdminProductList } = await import('@/domains/product/ui');
    render(<AdminProductList />);

    await waitFor(() => {
      expect(screen.getByText('テスト商品A')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: '削除' }));
    await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }));

    // ダイアログが閉じる
    expect(screen.queryByText('削除する')).not.toBeInTheDocument();
    // 商品はまだ表示されている
    expect(screen.getByText('テスト商品A')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────
// T021: ProductForm コンポーネント（新規登録モード）
// ─────────────────────────────────────────────────────────────────

describe('ProductForm（新規登録モード）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockPush.mockReset();
  });

  it('新規登録フォームが表示される', async () => {
    const { ProductForm } = await import('@/domains/product/ui');
    render(<ProductForm />);

    expect(screen.getByText('商品登録')).toBeInTheDocument();
    expect(screen.getByLabelText(/商品名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/価格/)).toBeInTheDocument();
    expect(screen.getByLabelText(/在庫数/)).toBeInTheDocument();
    expect(screen.getByLabelText(/説明/)).toBeInTheDocument();
    expect(screen.getByLabelText(/画像URL/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登録' })).toBeInTheDocument();
  });

  it('登録成功後に一覧ページに遷移する', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: createProductResponse() }),
    });

    const { ProductForm } = await import('@/domains/product/ui');
    render(<ProductForm />);

    await userEvent.type(screen.getByLabelText(/商品名/), 'テスト商品');
    await userEvent.clear(screen.getByLabelText(/価格/));
    await userEvent.type(screen.getByLabelText(/価格/), '1500');

    await userEvent.click(screen.getByRole('button', { name: '登録' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/products');
    });
  });

  it('バリデーションエラーが各フィールドの近くに表示される', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          fieldErrors: [
            { field: 'name', message: '商品名を入力してください' },
          ],
        },
      }),
    });

    const { ProductForm } = await import('@/domains/product/ui');
    render(<ProductForm />);

    // required属性があるため、値を入力してからサーバーバリデーションをテスト
    await userEvent.type(screen.getByLabelText(/商品名/), 'x');
    await userEvent.clear(screen.getByLabelText(/価格/));
    await userEvent.type(screen.getByLabelText(/価格/), '0');
    await userEvent.click(screen.getByRole('button', { name: '登録' }));

    await waitFor(() => {
      expect(screen.getByText('商品名を入力してください')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// T026-T027: ProductForm（編集モード）、AdminProductDetail
// ─────────────────────────────────────────────────────────────────

describe('ProductForm（編集モード）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockPush.mockReset();
  });

  it('既存データがプリロードされる', async () => {
    const { ProductForm } = await import('@/domains/product/ui');
    render(
      <ProductForm
        productId="550e8400-e29b-41d4-a716-446655440001"
        initialData={{ name: 'テスト商品', price: 1500, stock: 10, description: '説明文' }}
      />
    );

    expect(screen.getByText('商品編集')).toBeInTheDocument();
    expect(screen.getByLabelText(/商品名/)).toHaveValue('テスト商品');
    expect(screen.getByLabelText(/価格/)).toHaveValue(1500);
    expect(screen.getByLabelText(/在庫数/)).toHaveValue(10);
    expect(screen.getByLabelText(/説明/)).toHaveValue('説明文');
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
  });

  it('保存成功後に一覧ページに遷移する', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: createProductResponse({ name: '更新後' }) }),
    });

    const { ProductForm } = await import('@/domains/product/ui');
    render(
      <ProductForm
        productId="550e8400-e29b-41d4-a716-446655440001"
        initialData={{ name: 'テスト商品', price: 1500, stock: 10 }}
      />
    );

    await userEvent.clear(screen.getByLabelText(/商品名/));
    await userEvent.type(screen.getByLabelText(/商品名/), '更新後');
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/products/550e8400-e29b-41d4-a716-446655440001',
        expect.objectContaining({ method: 'PUT' })
      );
      expect(mockPush).toHaveBeenCalledWith('/admin/products');
    });
  });
});

describe('AdminProductDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockPush.mockReset();
  });

  it('商品データを取得してフォームに表示する', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: createProductResponse() }),
    });

    const { AdminProductDetail } = await import('@/domains/product/ui/admin');
    render(<AdminProductDetail />);

    await waitFor(() => {
      expect(screen.getByLabelText(/商品名/)).toHaveValue('テスト商品A');
    });
  });

  it('存在しない商品の場合に404を表示する', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ success: false, error: { code: 'NOT_FOUND', message: '商品が見つかりません' } }),
    });

    const { AdminProductDetail } = await import('@/domains/product/ui/admin');
    render(<AdminProductDetail />);

    await waitFor(() => {
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('商品が見つかりません')).toBeInTheDocument();
    });
  });
});
