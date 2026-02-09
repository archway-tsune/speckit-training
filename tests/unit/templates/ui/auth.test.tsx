/**
 * 認証UIコンポーネント 単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Forbidden } from '@/templates/ui/components/auth/Forbidden';

describe('認証UIコンポーネント', () => {
  describe('Forbidden コンポーネント', () => {
    it('Given デフォルト, When レンダリング, Then 権限不足メッセージが表示される', () => {
      // Act
      render(<Forbidden />);

      // Assert
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('アクセス権限がありません')).toBeInTheDocument();
    });

    it('Given カスタムメッセージ, When レンダリング, Then カスタムメッセージが表示される', () => {
      // Act
      render(<Forbidden message="この機能を利用する権限がありません" />);

      // Assert
      expect(screen.getByText('この機能を利用する権限がありません')).toBeInTheDocument();
    });

    it('Given redirectUrl, When レンダリング, Then リダイレクトリンクが表示される', () => {
      // Act
      render(<Forbidden redirectUrl="/catalog" redirectLabel="商品一覧へ戻る" />);

      // Assert
      expect(screen.getByRole('link', { name: '商品一覧へ戻る' })).toHaveAttribute(
        'href',
        '/catalog'
      );
    });

    it('Given title, When レンダリング, Then タイトルが表示される', () => {
      // Act
      render(<Forbidden title="403 Forbidden" message="権限がありません" />);

      // Assert
      expect(screen.getByText('403 Forbidden')).toBeInTheDocument();
    });
  });
});
