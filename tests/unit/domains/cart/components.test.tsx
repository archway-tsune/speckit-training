/**
 * カートドメイン — UIコンポーネント単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Cart, CartItem } from '@/contracts/cart';

// ─────────────────────────────────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────────────────────────────────

function createTestItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: '550e8400-e29b-41d4-a716-446655440001',
    productName: 'テスト商品A',
    price: 1000,
    imageUrl: 'https://example.com/a.jpg',
    quantity: 2,
    addedAt: new Date(),
    ...overrides,
  };
}

function createTestCart(items: CartItem[] = []): Cart {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    id: '550e8400-e29b-41d4-a716-446655440200',
    userId: '550e8400-e29b-41d4-a716-446655440100',
    items,
    subtotal,
    itemCount,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ─────────────────────────────────────────────────────────────────
// Phase 4: CartItem コンポーネントテスト (T014)
// ─────────────────────────────────────────────────────────────────

describe('CartItem コンポーネント', () => {
  it('商品名が表示されること', async () => {
    const { CartItem } = await import('@/domains/cart/ui');
    const item = createTestItem({ productName: 'ミニマルTシャツ' });
    render(<CartItem item={item} />);
    expect(screen.getByText('ミニマルTシャツ')).toBeInTheDocument();
  });

  it('単価が表示されること', async () => {
    const { CartItem } = await import('@/domains/cart/ui');
    const item = createTestItem({ price: 4980 });
    render(<CartItem item={item} />);
    expect(screen.getByText('¥4,980')).toBeInTheDocument();
  });

  it('数量が表示されること', async () => {
    const { CartItem } = await import('@/domains/cart/ui');
    const item = createTestItem({ quantity: 3 });
    render(<CartItem item={item} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('小計（単価×数量）が表示されること', async () => {
    const { CartItem } = await import('@/domains/cart/ui');
    const item = createTestItem({ price: 1000, quantity: 3 });
    render(<CartItem item={item} />);
    expect(screen.getByText('¥3,000')).toBeInTheDocument();
  });

  it('商品画像が表示されること', async () => {
    const { CartItem } = await import('@/domains/cart/ui');
    const item = createTestItem({ imageUrl: 'https://example.com/test.jpg', productName: 'テスト' });
    render(<CartItem item={item} />);
    const img = screen.getByAltText('テスト');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/test.jpg');
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 4: CartSummary コンポーネントテスト (T014)
// ─────────────────────────────────────────────────────────────────

describe('CartSummary コンポーネント', () => {
  it('商品合計を表示すること', async () => {
    const { CartSummary } = await import('@/domains/cart/ui');
    render(<CartSummary subtotal={10000} />);
    expect(screen.getByText('¥10,000')).toBeInTheDocument();
  });

  it('消費税（10%、端数切り捨て）を表示すること', async () => {
    const { CartSummary } = await import('@/domains/cart/ui');
    render(<CartSummary subtotal={1999} />);
    // Math.floor(1999 * 0.1) = 199
    expect(screen.getByText('¥199')).toBeInTheDocument();
  });

  it('総合計（商品合計+消費税）を表示すること', async () => {
    const { CartSummary } = await import('@/domains/cart/ui');
    render(<CartSummary subtotal={10000} />);
    // 10000 + 1000 = 11000
    expect(screen.getByText('¥11,000')).toBeInTheDocument();
  });

  it('端数切り捨ての計算例が正しいこと', async () => {
    const { CartSummary } = await import('@/domains/cart/ui');
    render(<CartSummary subtotal={33} />);
    // Math.floor(33 * 0.1) = 3, total = 36
    expect(screen.getByText('¥3')).toBeInTheDocument();
    expect(screen.getByText('¥36')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 4: CartView コンポーネントテスト (T014)
// ─────────────────────────────────────────────────────────────────

describe('CartView コンポーネント', () => {
  it('カートアイテム一覧が表示されること', async () => {
    const { CartView } = await import('@/domains/cart/ui');
    const items = [
      createTestItem({ productName: '商品A', price: 1000, quantity: 1 }),
      createTestItem({
        productId: '550e8400-e29b-41d4-a716-446655440002',
        productName: '商品B',
        price: 2000,
        quantity: 2,
      }),
    ];
    const cart = createTestCart(items);
    render(<CartView cart={cart} isLoading={false} />);
    expect(screen.getByText('商品A')).toBeInTheDocument();
    expect(screen.getByText('商品B')).toBeInTheDocument();
  });

  it('空カート時に「カートに商品がありません」メッセージが表示されること', async () => {
    const { CartView } = await import('@/domains/cart/ui');
    const cart = createTestCart([]);
    render(<CartView cart={cart} isLoading={false} />);
    expect(screen.getByText('カートに商品がありません')).toBeInTheDocument();
  });

  it('空カート時に商品一覧へのリンクが表示されること', async () => {
    const { CartView } = await import('@/domains/cart/ui');
    const cart = createTestCart([]);
    render(<CartView cart={cart} isLoading={false} />);
    const link = screen.getByRole('link', { name: /商品一覧/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/catalog');
  });

  it('ローディング中はローディング表示されること', async () => {
    const { CartView } = await import('@/domains/cart/ui');
    render(<CartView cart={null} isLoading={true} />);
    expect(screen.getByText(/読み込み/)).toBeInTheDocument();
  });

  it('エラー時はエラーメッセージが表示されること', async () => {
    const { CartView } = await import('@/domains/cart/ui');
    render(<CartView cart={null} isLoading={false} error="テストエラー" />);
    expect(screen.getByText('テストエラー')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 5: 数量変更UIテスト (T023)
// ─────────────────────────────────────────────────────────────────

describe('CartItem 数量変更', () => {
  it('onUpdateQuantity コールバックが呼ばれること', async () => {
    const { CartItem } = await import('@/domains/cart/ui');
    const item = createTestItem({ quantity: 2 });
    const onUpdateQuantity = vi.fn();
    render(<CartItem item={item} onUpdateQuantity={onUpdateQuantity} />);

    // QuantitySelector の + ボタンをクリック
    const incrementButton = screen.getByTestId('quantity-increment');
    fireEvent.click(incrementButton);

    expect(onUpdateQuantity).toHaveBeenCalledWith(item.productId, 3);
  });

  it('エラーメッセージが表示されること', async () => {
    const { CartItem } = await import('@/domains/cart/ui');
    const item = createTestItem();
    render(<CartItem item={item} error="在庫数を超えています" />);

    expect(screen.getByText('在庫数を超えています')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 6: 削除UI・確認ダイアログテスト (T030)
// ─────────────────────────────────────────────────────────────────

describe('CartItem 削除ボタン', () => {
  it('onRemove が渡された場合、削除ボタンが表示されること', async () => {
    const { CartItem } = await import('@/domains/cart/ui');
    const item = createTestItem({ productName: '削除テスト商品' });
    const onRemove = vi.fn();
    render(<CartItem item={item} onRemove={onRemove} />);

    const deleteButton = screen.getByRole('button', { name: /削除テスト商品を削除/ });
    expect(deleteButton).toBeInTheDocument();
  });

  it('onRemove が渡されない場合、削除ボタンが表示されないこと', async () => {
    const { CartItem } = await import('@/domains/cart/ui');
    const item = createTestItem({ productName: '削除テスト商品' });
    render(<CartItem item={item} />);

    expect(screen.queryByRole('button', { name: /削除テスト商品を削除/ })).not.toBeInTheDocument();
  });

  it('削除ボタンクリックで onRemove コールバックが呼ばれること', async () => {
    const { CartItem } = await import('@/domains/cart/ui');
    const item = createTestItem({ productName: '削除テスト商品' });
    const onRemove = vi.fn();
    render(<CartItem item={item} onRemove={onRemove} />);

    const deleteButton = screen.getByRole('button', { name: /削除テスト商品を削除/ });
    fireEvent.click(deleteButton);

    expect(onRemove).toHaveBeenCalledWith(item.productId);
  });
});

describe('CartView 確認ダイアログ', () => {
  it('削除ボタンクリックで確認ダイアログが表示されること', async () => {
    const { CartView } = await import('@/domains/cart/ui');
    const items = [createTestItem({ productName: 'ダイアログテスト商品' })];
    const cart = createTestCart(items);
    const onRemove = vi.fn();
    render(<CartView cart={cart} isLoading={false} onRemove={onRemove} />);

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /ダイアログテスト商品を削除/ });
    fireEvent.click(deleteButton);

    // 確認ダイアログが表示される
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    expect(screen.getByText(/カートから削除しますか/)).toBeInTheDocument();
  });

  it('確認ダイアログで「削除する」をクリックすると onRemove が呼ばれること', async () => {
    const { CartView } = await import('@/domains/cart/ui');
    const items = [createTestItem({ productName: 'ダイアログテスト商品' })];
    const cart = createTestCart(items);
    const onRemove = vi.fn();
    render(<CartView cart={cart} isLoading={false} onRemove={onRemove} />);

    // 削除ボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: /ダイアログテスト商品を削除/ }));

    // 確認ダイアログの「削除する」をクリック
    fireEvent.click(screen.getByTestId('confirm-button'));

    expect(onRemove).toHaveBeenCalledWith(items[0].productId);
  });

  it('確認ダイアログで「キャンセル」をクリックすると onRemove が呼ばれないこと', async () => {
    const { CartView } = await import('@/domains/cart/ui');
    const items = [createTestItem({ productName: 'ダイアログテスト商品' })];
    const cart = createTestCart(items);
    const onRemove = vi.fn();
    render(<CartView cart={cart} isLoading={false} onRemove={onRemove} />);

    // 削除ボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: /ダイアログテスト商品を削除/ }));

    // 確認ダイアログの「キャンセル」をクリック
    fireEvent.click(screen.getByTestId('cancel-button'));

    expect(onRemove).not.toHaveBeenCalled();
    // ダイアログが閉じる
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });
});
