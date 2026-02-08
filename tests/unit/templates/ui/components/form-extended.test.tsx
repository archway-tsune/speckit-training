import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SearchBar, QuantitySelector } from '@/templates/ui/components/form';

// ─────────────────────────────────────────────────────────────────
// SearchBar
// ─────────────────────────────────────────────────────────────────

describe('SearchBar コンポーネント', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('検索実行', () => {
    it('Given テキスト入力済み, When Enterキーを押す, Then onSearchが入力テキストで呼ばれる', async () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} />);

      const input = screen.getByTestId('search-input');
      await user.type(input, 'テスト商品{Enter}');

      expect(onSearch).toHaveBeenCalledWith('テスト商品');
    });

    it('Given 空の入力, When Enterキーを押す, Then onSearchが空文字列で呼ばれる', async () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} />);

      const input = screen.getByTestId('search-input');
      await user.click(input);
      await user.keyboard('{Enter}');

      expect(onSearch).toHaveBeenCalledWith('');
    });
  });

  describe('クリアボタン', () => {
    it('Given テキスト入力済み, When クリアボタンを押す, Then 入力がリセットされonSearchが空文字列で呼ばれる', async () => {
      const onSearch = vi.fn();
      render(<SearchBar onSearch={onSearch} defaultValue="初期値" />);

      await user.click(screen.getByTestId('search-clear'));

      expect(onSearch).toHaveBeenCalledWith('');
      expect(screen.getByTestId('search-input')).toHaveValue('');
    });
  });

  describe('プレースホルダー', () => {
    it('Given placeholder指定, When レンダリング, Then カスタムプレースホルダーが表示される', () => {
      render(<SearchBar onSearch={vi.fn()} placeholder="商品名で検索..." />);
      expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', '商品名で検索...');
    });

    it('Given placeholder未指定, When レンダリング, Then デフォルトプレースホルダーが表示される', () => {
      render(<SearchBar onSearch={vi.fn()} />);
      expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', '検索...');
    });
  });

  describe('アクセシビリティ', () => {
    it('Given SearchBar, When レンダリング, Then search roleが設定されている', () => {
      render(<SearchBar onSearch={vi.fn()} />);
      expect(screen.getByRole('search')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// QuantitySelector
// ─────────────────────────────────────────────────────────────────

describe('QuantitySelector コンポーネント', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('増加操作', () => {
    it('Given value=3, max=10, When +ボタンを押す, Then onChange(4) が呼ばれる', async () => {
      const onChange = vi.fn();
      render(<QuantitySelector value={3} min={1} max={10} onChange={onChange} />);

      await user.click(screen.getByTestId('quantity-increment'));
      expect(onChange).toHaveBeenCalledWith(4);
    });
  });

  describe('減少操作', () => {
    it('Given value=3, min=1, When -ボタンを押す, Then onChange(2) が呼ばれる', async () => {
      const onChange = vi.fn();
      render(<QuantitySelector value={3} min={1} max={10} onChange={onChange} />);

      await user.click(screen.getByTestId('quantity-decrement'));
      expect(onChange).toHaveBeenCalledWith(2);
    });
  });

  describe('最小値制約', () => {
    it('Given value=1, min=1, When レンダリング, Then -ボタンが無効化されている', () => {
      render(<QuantitySelector value={1} min={1} max={10} onChange={vi.fn()} />);
      expect(screen.getByTestId('quantity-decrement')).toBeDisabled();
    });
  });

  describe('最大値制約', () => {
    it('Given value=10, max=10, When レンダリング, Then +ボタンが無効化されている', () => {
      render(<QuantitySelector value={10} min={1} max={10} onChange={vi.fn()} />);
      expect(screen.getByTestId('quantity-increment')).toBeDisabled();
    });
  });

  describe('無効化状態', () => {
    it('Given disabled=true, When レンダリング, Then 全コントロールが無効化されている', () => {
      render(<QuantitySelector value={3} min={1} max={10} onChange={vi.fn()} disabled />);
      expect(screen.getByTestId('quantity-increment')).toBeDisabled();
      expect(screen.getByTestId('quantity-decrement')).toBeDisabled();
    });
  });

  describe('min > max', () => {
    it('Given min > max, When レンダリング, Then 全コントロールが無効化されている', () => {
      render(<QuantitySelector value={5} min={10} max={1} onChange={vi.fn()} />);
      expect(screen.getByTestId('quantity-increment')).toBeDisabled();
      expect(screen.getByTestId('quantity-decrement')).toBeDisabled();
    });
  });

  describe('数値表示', () => {
    it('Given value=5, When レンダリング, Then 数値5が表示される', () => {
      render(<QuantitySelector value={5} min={1} max={10} onChange={vi.fn()} />);
      expect(screen.getByTestId('quantity-value')).toHaveTextContent('5');
    });
  });
});
