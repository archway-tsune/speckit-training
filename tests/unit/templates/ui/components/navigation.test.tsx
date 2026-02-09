import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Pagination } from '@/templates/ui/components/navigation';

describe('Pagination コンポーネント', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('表示テキスト', () => {
    it('Given page=1, total=50, limit=10, When レンダリング, Then 「全50件中 1〜10件を表示」が表示される', () => {
      render(
        <Pagination page={1} limit={10} total={50} totalPages={5} onPageChange={vi.fn()} />
      );
      expect(screen.getByTestId('pagination-info')).toHaveTextContent('全50件中 1〜10件を表示');
    });

    it('Given page=3, total=25, limit=10, When レンダリング, Then 「全25件中 21〜25件を表示」が表示される', () => {
      render(
        <Pagination page={3} limit={10} total={25} totalPages={3} onPageChange={vi.fn()} />
      );
      expect(screen.getByTestId('pagination-info')).toHaveTextContent('全25件中 21〜25件を表示');
    });
  });

  describe('前へボタン', () => {
    it('Given page=1, When レンダリング, Then 「前へ」ボタンが無効化されている', () => {
      render(
        <Pagination page={1} limit={10} total={50} totalPages={5} onPageChange={vi.fn()} />
      );
      expect(screen.getByTestId('pagination-prev')).toBeDisabled();
    });

    it('Given page=2, When 「前へ」ボタンをクリック, Then onPageChange(1) が呼ばれる', async () => {
      const onPageChange = vi.fn();
      render(
        <Pagination page={2} limit={10} total={50} totalPages={5} onPageChange={onPageChange} />
      );
      await user.click(screen.getByTestId('pagination-prev'));
      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  describe('次へボタン', () => {
    it('Given 最終ページ, When レンダリング, Then 「次へ」ボタンが無効化されている', () => {
      render(
        <Pagination page={5} limit={10} total={50} totalPages={5} onPageChange={vi.fn()} />
      );
      expect(screen.getByTestId('pagination-next')).toBeDisabled();
    });

    it('Given page=2, When 「次へ」ボタンをクリック, Then onPageChange(3) が呼ばれる', async () => {
      const onPageChange = vi.fn();
      render(
        <Pagination page={2} limit={10} total={50} totalPages={5} onPageChange={onPageChange} />
      );
      await user.click(screen.getByTestId('pagination-next'));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });
  });

  describe('非表示条件', () => {
    it('Given total=0, When レンダリング, Then コンポーネントが非表示になる', () => {
      const { container } = render(
        <Pagination page={1} limit={10} total={0} totalPages={0} onPageChange={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('Given totalPages=1, When レンダリング, Then コンポーネントが非表示になる', () => {
      const { container } = render(
        <Pagination page={1} limit={10} total={5} totalPages={1} onPageChange={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('アクセシビリティ', () => {
    it('Given 正常な状態, When レンダリング, Then nav要素にaria-labelが設定されている', () => {
      render(
        <Pagination page={1} limit={10} total={50} totalPages={5} onPageChange={vi.fn()} />
      );
      expect(screen.getByRole('navigation')).toHaveAccessibleName('ページネーション');
    });
  });
});
