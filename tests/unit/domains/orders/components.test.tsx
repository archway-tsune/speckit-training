/**
 * 注文ドメイン — UIコンポーネント単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderList } from '@/domains/orders/ui/OrderList';
import { OrderDetail } from '@/domains/orders/ui/OrderDetail';
import type { Order } from '@/contracts/orders';

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: '550e8400-e29b-41d4-a716-446655440300',
    userId: '550e8400-e29b-41d4-a716-446655440100',
    items: [
      {
        productId: '550e8400-e29b-41d4-a716-446655440001',
        productName: 'テスト商品A',
        price: 1000,
        quantity: 2,
      },
    ],
    totalAmount: 2000,
    status: 'pending',
    createdAt: new Date('2026-01-15T10:00:00Z'),
    updatedAt: new Date('2026-01-15T10:00:00Z'),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────
// Phase 4: US2 - OrderList コンポーネント単体テスト (T016)
// ─────────────────────────────────────────────────────────────────

describe('OrderList', () => {
  it('注文一覧が表示されること（注文ID先頭8桁・注文日・商品数・合計金額・ステータス）', () => {
    const orders = [createMockOrder()];
    render(
      <OrderList
        orders={orders}
        isLoading={false}
        pagination={{ page: 1, limit: 20, total: 1, totalPages: 1 }}
      />
    );

    // 注文ID先頭8桁
    expect(screen.getByText(/550e8400/)).toBeDefined();
    // 商品数
    expect(screen.getByText(/1点/)).toBeDefined();
    // 合計金額
    expect(screen.getByText('¥2,000')).toBeDefined();
    // ステータスバッジ
    expect(screen.getByText('処理待ち')).toBeDefined();
  });

  it('複数注文が一覧表示されること', () => {
    const orders = [
      createMockOrder(),
      createMockOrder({
        id: '660e8400-e29b-41d4-a716-446655440301',
        totalAmount: 5000,
        status: 'confirmed',
      }),
    ];
    render(
      <OrderList
        orders={orders}
        isLoading={false}
        pagination={{ page: 1, limit: 20, total: 2, totalPages: 1 }}
      />
    );

    expect(screen.getAllByTestId('order-row')).toHaveLength(2);
  });

  it('ページネーションが表示されること', () => {
    const orders = [createMockOrder()];
    render(
      <OrderList
        orders={orders}
        isLoading={false}
        pagination={{ page: 1, limit: 20, total: 25, totalPages: 2 }}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText(/全25件中/)).toBeDefined();
    expect(screen.getByRole('button', { name: '前へ' })).toBeDefined();
    expect(screen.getByRole('button', { name: '次へ' })).toBeDefined();
  });

  it('注文0件で空メッセージが表示されること', () => {
    render(
      <OrderList
        orders={[]}
        isLoading={false}
        pagination={{ page: 1, limit: 20, total: 0, totalPages: 0 }}
      />
    );

    expect(screen.getByText(/注文履歴がありません/)).toBeDefined();
  });

  it('ローディング中はローディング表示されること', () => {
    render(
      <OrderList
        orders={[]}
        isLoading={true}
        pagination={null}
      />
    );

    expect(screen.getByText(/読み込み中/)).toBeDefined();
  });

  it('エラー時はエラーメッセージが表示されること', () => {
    render(
      <OrderList
        orders={[]}
        isLoading={false}
        error="取得に失敗しました"
        pagination={null}
      />
    );

    expect(screen.getByText(/取得に失敗しました/)).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 4: US2 - OrderDetail コンポーネント単体テスト (T016)
// ─────────────────────────────────────────────────────────────────

describe('OrderDetail', () => {
  it('注文ID・注文日時・ステータス・商品一覧・合計金額が表示されること', () => {
    const order = createMockOrder();
    render(<OrderDetail order={order} isLoading={false} />);

    // 注文ID
    expect(screen.getByText(/550e8400-e29b-41d4-a716-446655440300/)).toBeDefined();
    // ステータスバッジ
    expect(screen.getByTestId('order-status')).toBeDefined();
    expect(screen.getByText('処理待ち')).toBeDefined();
    // 商品名
    expect(screen.getByText('テスト商品A')).toBeDefined();
    // 合計金額（小計と合計の両方で表示される可能性がある）
    expect(screen.getAllByText('¥2,000').length).toBeGreaterThanOrEqual(1);
  });

  it('商品の単価×数量と小計が表示されること', () => {
    const order = createMockOrder();
    render(<OrderDetail order={order} isLoading={false} />);

    expect(screen.getByText(/¥1,000 × 2/)).toBeDefined();
  });

  it('ローディング中はローディング表示されること', () => {
    render(<OrderDetail order={null} isLoading={true} />);

    expect(screen.getByText(/読み込み中/)).toBeDefined();
  });

  it('エラー時はエラーメッセージが表示されること', () => {
    render(<OrderDetail order={null} isLoading={false} error="取得に失敗しました" />);

    expect(screen.getByText(/取得に失敗しました/)).toBeDefined();
  });

  it('注文が null の場合はエラーメッセージが表示されること', () => {
    render(<OrderDetail order={null} isLoading={false} />);

    expect(screen.getByText(/注文が見つかりません/)).toBeDefined();
  });

  it('注文完了メッセージが表示されること（completed=true 時）', () => {
    const order = createMockOrder();
    render(<OrderDetail order={order} isLoading={false} showCompletedMessage={true} />);

    expect(screen.getByText(/ご注文ありがとうございます/)).toBeDefined();
  });

  it('戻るボタンがクリックできること', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const order = createMockOrder();
    render(<OrderDetail order={order} isLoading={false} onBack={onBack} />);

    await user.click(screen.getByText(/注文一覧に戻る/));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
