/**
 * レイアウトコンポーネント 単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Header } from '@/templates/ui/components/layout/Header';
import { Footer } from '@/templates/ui/components/layout/Footer';
import { Layout } from '@/templates/ui/components/layout/Layout';

describe('レイアウトコンポーネント', () => {
  const user = userEvent.setup();

  describe('Header コンポーネント', () => {
    it('Given デフォルト, When レンダリング, Then ヘッダーが表示される', () => {
      // Act
      render(<Header />);

      // Assert
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('Given ロゴ, When レンダリング, Then ロゴが表示される', () => {
      // Act
      render(<Header siteName="ECサイト" />);

      // Assert
      expect(screen.getByText('ECサイト')).toBeInTheDocument();
    });

    it('Given カート件数, When レンダリング, Then カート件数が表示される', () => {
      // Act
      render(<Header cartCount={3} />);

      // Assert
      expect(screen.getByTestId('cart-count')).toHaveTextContent('3');
    });

    it('Given ログイン済み, When レンダリング, Then ユーザー名が表示される', () => {
      // Act
      render(<Header isLoggedIn={true} userName="テストユーザー" />);

      // Assert
      expect(screen.getByText('テストユーザー')).toBeInTheDocument();
    });

    it('Given 未ログイン, When レンダリング, Then ログインリンクが表示される', () => {
      // Act
      render(<Header isLoggedIn={false} />);

      // Assert
      expect(screen.getByRole('link', { name: 'ログイン' })).toBeInTheDocument();
    });

    it('Given ナビゲーションリンク, When レンダリング, Then ナビゲーションが表示される', () => {
      // Arrange
      const navLinks = [
        { href: '/catalog', label: '商品一覧' },
        { href: '/orders', label: '注文履歴' },
      ];

      // Act
      render(<Header navLinks={navLinks} />);

      // Assert
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '商品一覧' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '注文履歴' })).toBeInTheDocument();
    });
  });

  describe('Footer コンポーネント', () => {
    it('Given デフォルト, When レンダリング, Then フッターが表示される', () => {
      // Act
      render(<Footer />);

      // Assert
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('Given コピーライト, When レンダリング, Then コピーライトが表示される', () => {
      // Act
      render(<Footer copyright="© 2026 EC Site" />);

      // Assert
      expect(screen.getByText('© 2026 EC Site')).toBeInTheDocument();
    });

    it('Given フッターリンク, When レンダリング, Then リンクが表示される', () => {
      // Arrange
      const links = [
        { href: '/privacy', label: 'プライバシーポリシー' },
        { href: '/terms', label: '利用規約' },
      ];

      // Act
      render(<Footer links={links} />);

      // Assert
      expect(screen.getByRole('link', { name: 'プライバシーポリシー' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '利用規約' })).toBeInTheDocument();
    });
  });

  describe('Layout コンポーネント', () => {
    it('Given children, When レンダリング, Then childrenが表示される', () => {
      // Act
      render(
        <Layout>
          <main>コンテンツ</main>
        </Layout>
      );

      // Assert
      expect(screen.getByText('コンテンツ')).toBeInTheDocument();
    });

    it('Given デフォルト, When レンダリング, Then Header/Footerが含まれる', () => {
      // Act
      render(
        <Layout>
          <div>テスト</div>
        </Layout>
      );

      // Assert
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('Given showHeader=false, When レンダリング, Then Headerが非表示', () => {
      // Act
      render(
        <Layout showHeader={false}>
          <div>テスト</div>
        </Layout>
      );

      // Assert
      expect(screen.queryByRole('banner')).not.toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('Given showFooter=false, When レンダリング, Then Footerが非表示', () => {
      // Act
      render(
        <Layout showFooter={false}>
          <div>テスト</div>
        </Layout>
      );

      // Assert
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    });
  });
});
