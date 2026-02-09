/**
 * 状態表示コンポーネント 単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Loading } from '@/templates/ui/components/status/Loading';
import { Error } from '@/templates/ui/components/status/Error';
import { Empty } from '@/templates/ui/components/status/Empty';

describe('状態表示コンポーネント', () => {
  describe('Loading コンポーネント', () => {
    it('Given デフォルト, When レンダリング, Then ローディング表示が出る', () => {
      // Act
      render(<Loading />);

      // Assert
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('Given カスタムメッセージ, When レンダリング, Then カスタムメッセージが表示される', () => {
      // Act
      render(<Loading message="データを取得中..." />);

      // Assert
      expect(screen.getByText('データを取得中...')).toBeInTheDocument();
    });

    it('Given size="sm", When レンダリング, Then 小さいスピナーが表示される', () => {
      // Act
      render(<Loading size="sm" />);

      // Assert
      expect(screen.getByTestId('loading-spinner')).toHaveClass('w-4', 'h-4');
    });

    it('Given size="lg", When レンダリング, Then 大きいスピナーが表示される', () => {
      // Act
      render(<Loading size="lg" />);

      // Assert
      expect(screen.getByTestId('loading-spinner')).toHaveClass('w-12', 'h-12');
    });
  });

  describe('Error コンポーネント', () => {
    it('Given エラーメッセージ, When レンダリング, Then エラー表示が出る', () => {
      // Act
      render(<Error message="エラーが発生しました" />);

      // Assert
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });

    it('Given リトライ関数, When レンダリング, Then リトライボタンが表示される', () => {
      // Arrange
      const onRetry = () => {};

      // Act
      render(<Error message="エラー" onRetry={onRetry} />);

      // Assert
      expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument();
    });

    it('Given リトライ関数なし, When レンダリング, Then リトライボタンは非表示', () => {
      // Act
      render(<Error message="エラー" />);

      // Assert
      expect(screen.queryByRole('button', { name: '再試行' })).not.toBeInTheDocument();
    });

    it('Given エラータイトル, When レンダリング, Then タイトルが表示される', () => {
      // Act
      render(<Error message="詳細メッセージ" title="エラータイトル" />);

      // Assert
      expect(screen.getByText('エラータイトル')).toBeInTheDocument();
      expect(screen.getByText('詳細メッセージ')).toBeInTheDocument();
    });
  });

  describe('Empty コンポーネント', () => {
    it('Given デフォルト, When レンダリング, Then 空状態表示が出る', () => {
      // Act
      render(<Empty />);

      // Assert
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('データがありません')).toBeInTheDocument();
    });

    it('Given カスタムメッセージ, When レンダリング, Then カスタムメッセージが表示される', () => {
      // Act
      render(<Empty message="商品が見つかりませんでした" />);

      // Assert
      expect(screen.getByText('商品が見つかりませんでした')).toBeInTheDocument();
    });

    it('Given アクション, When レンダリング, Then アクションボタンが表示される', () => {
      // Arrange
      const onAction = () => {};

      // Act
      render(<Empty message="カートは空です" actionLabel="買い物を続ける" onAction={onAction} />);

      // Assert
      expect(screen.getByRole('button', { name: '買い物を続ける' })).toBeInTheDocument();
    });

    it('Given アクションなし, When レンダリング, Then アクションボタンは非表示', () => {
      // Act
      render(<Empty message="カートは空です" />);

      // Assert
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
