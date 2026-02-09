/**
 * Cart ドメイン - UI単体テスト
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartView } from '@/samples/domains/cart/ui/CartView';
import type { Cart, CartItem } from '@/contracts/cart';

// ─────────────────────────────────────────────────────────────────
// テストヘルパー
// ─────────────────────────────────────────────────────────────────

function createMockCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: '550e8400-e29b-41d4-a716-446655440001',
    productName: 'テスト商品',
    price: 1000,
    quantity: 1,
    addedAt: new Date(),
    ...overrides,
  };
}

function createMockCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: '550e8400-e29b-41d4-a716-446655440099',
    items: [],
    subtotal: 0,
    itemCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────
// CartView
// ─────────────────────────────────────────────────────────────────

describe('CartView', () => {
  describe('Given: loading状態', () => {
    describe('When: カートを表示する', () => {
      it('Then: ローディング表示を出す', () => {
        render(<CartView cart={null} isLoading={true} />);
        expect(screen.getByRole('status', { name: /読み込み中/i })).toBeInTheDocument();
      });
    });
  });

  describe('Given: error状態', () => {
    describe('When: カートを表示する', () => {
      it('Then: エラー表示を出す', () => {
        render(<CartView cart={null} isLoading={false} error="カートの取得に失敗しました" />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('カートの取得に失敗しました')).toBeInTheDocument();
      });
    });
  });

  describe('Given: empty状態', () => {
    describe('When: カートが空', () => {
      it('Then: 空状態表示を出す', () => {
        render(<CartView cart={createMockCart()} isLoading={false} />);
        expect(screen.getByText(/カートは空です/i)).toBeInTheDocument();
      });
    });
  });

  describe('Given: カート内に商品あり', () => {
    describe('When: カートを表示する', () => {
      it('Then: 商品一覧を表示する', () => {
        const cart = createMockCart({
          items: [
            createMockCartItem({ productName: '商品A', price: 1000, quantity: 2 }),
            createMockCartItem({
              productId: '550e8400-e29b-41d4-a716-446655440002',
              productName: '商品B',
              price: 2000,
              quantity: 1,
            }),
          ],
          subtotal: 4000,
          itemCount: 3,
        });

        render(<CartView cart={cart} isLoading={false} />);

        expect(screen.getByText('商品A')).toBeInTheDocument();
        expect(screen.getByText('商品B')).toBeInTheDocument();
        expect(screen.getByText('¥4,000')).toBeInTheDocument();
        expect(screen.getByText(/商品数: 3点/)).toBeInTheDocument();
      });

      it('Then: 数量変更セレクトを表示する', () => {
        const cart = createMockCart({
          items: [createMockCartItem()],
          subtotal: 1000,
          itemCount: 1,
        });

        render(<CartView cart={cart} isLoading={false} />);

        const select = screen.getByLabelText(/数量/i);
        expect(select).toBeInTheDocument();
        expect(select).toHaveValue('1');
      });
    });

    describe('When: 数量を変更する', () => {
      it('Then: onUpdateQuantityコールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onUpdateQuantity = vi.fn();
        const cart = createMockCart({
          items: [createMockCartItem()],
          subtotal: 1000,
          itemCount: 1,
        });

        render(
          <CartView cart={cart} isLoading={false} onUpdateQuantity={onUpdateQuantity} />
        );

        await user.selectOptions(screen.getByLabelText(/数量/i), '3');
        expect(onUpdateQuantity).toHaveBeenCalledWith(
          '550e8400-e29b-41d4-a716-446655440001',
          3
        );
      });
    });

    describe('When: 削除ボタンをクリックする', () => {
      it('Then: onRemoveコールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onRemove = vi.fn();
        const cart = createMockCart({
          items: [createMockCartItem({ productName: '削除対象商品' })],
          subtotal: 1000,
          itemCount: 1,
        });

        render(<CartView cart={cart} isLoading={false} onRemove={onRemove} />);

        await user.click(screen.getByRole('button', { name: /削除対象商品を削除/i }));
        expect(onRemove).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001');
      });
    });

    describe('When: 注文手続きボタンをクリックする', () => {
      it('Then: onCheckoutコールバックを呼ぶ', async () => {
        const user = userEvent.setup();
        const onCheckout = vi.fn();
        const cart = createMockCart({
          items: [createMockCartItem()],
          subtotal: 1000,
          itemCount: 1,
        });

        render(<CartView cart={cart} isLoading={false} onCheckout={onCheckout} />);

        await user.click(screen.getByRole('button', { name: /注文手続きへ/i }));
        expect(onCheckout).toHaveBeenCalled();
      });
    });
  });
});
