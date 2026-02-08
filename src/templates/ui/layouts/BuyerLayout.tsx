/**
 * 購入者レイアウトテンプレート
 *
 * 使用例:
 * - ECサイトの購入者向けページ
 * - カタログ・カート・注文履歴などの画面
 *
 * カスタマイズポイント:
 * - navLinks: ヘッダーのナビゲーションリンク
 * - footerLinks: フッターのリンク
 * - sessionEndpoint: セッション確認APIのエンドポイント
 * - loginEndpoint: ログインAPIのエンドポイント
 * - cartEndpoint: カート取得APIのエンドポイント
 * - autoLogin: 未認証時の自動ログイン設定
 * - siteName: サイト名
 */
'use client';

import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { Layout } from '@/templates/ui/components/layout/Layout';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export interface NavLink {
  href: string;
  label: string;
}

export interface SessionData {
  userId: string;
  role: string;
  name: string;
}

export interface AutoLoginConfig {
  enabled: boolean;
  email: string;
  password: string;
}

export interface BuyerLayoutProps {
  children: ReactNode;
  /** サイト名 */
  siteName?: string;
  /** ナビゲーションリンク */
  navLinks?: NavLink[];
  /** フッターリンク */
  footerLinks?: NavLink[];
  /** フッターコピーライト */
  copyright?: string;
  /** セッション確認APIエンドポイント */
  sessionEndpoint?: string;
  /** ログインAPIエンドポイント */
  loginEndpoint?: string;
  /** カート取得APIエンドポイント */
  cartEndpoint?: string;
  /** ログインページパス */
  loginPath?: string;
  /** ログアウトAPIパス */
  logoutPath?: string;
  /** 自動ログイン設定（デモ用） */
  autoLogin?: AutoLoginConfig;
  /** カート更新イベント名 */
  cartUpdateEvent?: string;
}

// ─────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────

/**
 * 購入者用レイアウトコンポーネント
 * 自動ログインとカート状態管理を提供
 */
export function BuyerLayout({
  children,
  siteName = 'EC Site',
  navLinks = [
    { href: '/catalog', label: '商品一覧' },
    { href: '/cart', label: 'カート' },
    { href: '/orders', label: '注文履歴' },
  ],
  footerLinks = [
    { href: '/privacy', label: 'プライバシーポリシー' },
    { href: '/terms', label: '利用規約' },
  ],
  copyright = '© 2026 EC Site',
  sessionEndpoint = '/api/auth/session',
  loginEndpoint = '/api/auth/login',
  cartEndpoint = '/api/cart',
  loginPath = '/login',
  logoutPath = '/api/auth/logout',
  autoLogin = {
    enabled: false,
    email: 'buyer@example.com',
    password: 'demo',
  },
  cartUpdateEvent = 'cart-updated',
}: BuyerLayoutProps) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const initRef = useRef(false);

  const fetchSession = useCallback(async (): Promise<SessionData | null> => {
    try {
      const res = await fetch(sessionEndpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSession(data.data);
          return data.data;
        }
      }
    } catch {
      // セッションなし
    }
    return null;
  }, [sessionEndpoint]);

  const doAutoLogin = useCallback(async () => {
    if (!autoLogin.enabled) return null;

    try {
      const res = await fetch(loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: autoLogin.email, password: autoLogin.password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSession(data.data);
          return data.data;
        }
      }
    } catch {
      // ログイン失敗
    }
    return null;
  }, [loginEndpoint, autoLogin]);

  const fetchCartCount = useCallback(async () => {
    try {
      const res = await fetch(cartEndpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCartCount(data.data.itemCount || 0);
        }
      }
    } catch {
      // カートなし
    }
  }, [cartEndpoint]);

  useEffect(() => {
    const init = async () => {
      if (initRef.current) return;
      initRef.current = true;

      let currentSession = await fetchSession();
      if (!currentSession && autoLogin.enabled) {
        currentSession = await doAutoLogin();
      }
      if (currentSession) {
        await fetchCartCount();
      }
      setIsReady(true);
    };
    init();

    // カスタムイベントでカート更新を監視
    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener(cartUpdateEvent, handleCartUpdate);

    return () => {
      window.removeEventListener(cartUpdateEvent, handleCartUpdate);
    };
  }, [fetchSession, doAutoLogin, fetchCartCount, autoLogin.enabled, cartUpdateEvent]);

  // 認証が完了するまでローディング表示
  if (!isReady) {
    return (
      <Layout
        headerProps={{
          siteName,
          navLinks,
          cartCount: 0,
          isLoggedIn: false,
          loginHref: loginPath,
        }}
        footerProps={{
          copyright,
          links: footerLinks,
        }}
      >
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-base-900 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      headerProps={{
        siteName,
        navLinks,
        cartCount,
        isLoggedIn: !!session,
        userName: session?.name,
        loginHref: loginPath,
        logoutHref: logoutPath,
      }}
      footerProps={{
        copyright,
        links: footerLinks,
      }}
    >
      {children}
    </Layout>
  );
}

export default BuyerLayout;
