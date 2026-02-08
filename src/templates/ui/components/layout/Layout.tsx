/**
 * Layout コンポーネント
 * 共通レイアウトコンポーネント
 */
import React from 'react';
import { Header, type HeaderProps } from './Header';
import { Footer, type FooterProps } from './Footer';

export interface LayoutProps {
  /** 子要素 */
  children: React.ReactNode;
  /** ヘッダーを表示するか */
  showHeader?: boolean;
  /** フッターを表示するか */
  showFooter?: boolean;
  /** ヘッダーのProps */
  headerProps?: HeaderProps;
  /** フッターのProps */
  footerProps?: FooterProps;
}

/**
 * 共通レイアウトコンポーネント
 */
export function Layout({
  children,
  showHeader = true,
  showFooter = true,
  headerProps,
  footerProps,
}: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-base-50">
      {showHeader && <Header {...headerProps} />}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer {...footerProps} />}
    </div>
  );
}
