/**
 * フィードバックコンポーネント 単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ConfirmDialog } from '@/templates/ui/components/dialog/ConfirmDialog';

describe('フィードバックコンポーネント', () => {
  describe('ConfirmDialog コンポーネント', () => {
    const defaultProps = {
      open: true,
      message: 'この操作を実行しますか？',
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    };

    it('Given open=true, When レンダリング, Then ダイアログが表示される', () => {
      // Act
      render(<ConfirmDialog {...defaultProps} />);

      // Assert
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('この操作を実行しますか？')).toBeInTheDocument();
    });

    it('Given open=false, When レンダリング, Then ダイアログは非表示', () => {
      // Act
      render(<ConfirmDialog {...defaultProps} open={false} />);

      // Assert
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Given タイトル指定, When レンダリング, Then タイトルが表示される', () => {
      // Act
      render(<ConfirmDialog {...defaultProps} title="商品の削除" />);

      // Assert
      expect(screen.getByText('商品の削除')).toBeInTheDocument();
    });

    it('Given デフォルト, When レンダリング, Then 確認・キャンセルボタンが表示される', () => {
      // Act
      render(<ConfirmDialog {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('confirm-button')).toHaveTextContent('確認');
      expect(screen.getByTestId('cancel-button')).toHaveTextContent('キャンセル');
    });

    it('Given カスタムラベル, When レンダリング, Then カスタムラベルが表示される', () => {
      // Act
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmLabel="削除する"
          cancelLabel="戻る"
        />,
      );

      // Assert
      expect(screen.getByTestId('confirm-button')).toHaveTextContent('削除する');
      expect(screen.getByTestId('cancel-button')).toHaveTextContent('戻る');
    });

    it('Given 確認ボタンクリック, When onConfirm, Then コールバックが呼ばれる', () => {
      // Arrange
      const onConfirm = vi.fn();

      // Act
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
      fireEvent.click(screen.getByTestId('confirm-button'));

      // Assert
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('Given キャンセルボタンクリック, When onCancel, Then コールバックが呼ばれる', () => {
      // Arrange
      const onCancel = vi.fn();

      // Act
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
      fireEvent.click(screen.getByTestId('cancel-button'));

      // Assert
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('Given Escapeキー押下, When onCancel, Then コールバックが呼ばれる', () => {
      // Arrange
      const onCancel = vi.fn();

      // Act
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
      fireEvent.keyDown(document, { key: 'Escape' });

      // Assert
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('Given オーバーレイクリック, When onCancel, Then コールバックが呼ばれる', () => {
      // Arrange
      const onCancel = vi.fn();

      // Act
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
      fireEvent.click(screen.getByTestId('confirm-dialog'));

      // Assert
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('Given variant="danger", When レンダリング, Then 赤いボタンが表示される', () => {
      // Act
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      // Assert
      expect(screen.getByTestId('confirm-button')).toHaveClass('bg-red-600');
    });

    it('Given aria属性, When レンダリング, Then アクセシビリティ属性が設定される', () => {
      // Act
      render(<ConfirmDialog {...defaultProps} title="確認" />);

      // Assert
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'confirm-dialog-message');
    });
  });
});
