'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Layout } from '@/templates/ui/components/layout/Layout';
import type { NavLink } from '@/templates/ui/components/layout/Header';

interface SessionData {
  userId: string;
  role: 'buyer' | 'admin';
  name: string;
}

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const fetchSession = useCallback(async (): Promise<SessionData | null> => {
    try {
      const res = await fetch('/sample/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch {
      // セッションなし
    }
    return null;
  }, []);

  const fetchCartCount = useCallback(async () => {
    try {
      const res = await fetch('/sample/api/cart');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCartCount(data.data.itemCount || 0);
        }
      }
    } catch {
      // カートなし
    }
  }, []);

  // 初回読み込みとルート変更時にセッションを確認
  useEffect(() => {
    const checkSession = async () => {
      const currentSession = await fetchSession();
      setSession(currentSession);
      if (currentSession) {
        await fetchCartCount();
      } else {
        setCartCount(0);
      }
      setIsReady(true);
    };
    checkSession();
  }, [pathname, fetchSession, fetchCartCount]);

  // カスタムイベントでカート更新を監視
  useEffect(() => {
    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [fetchCartCount]);

  const navLinks: NavLink[] = [
    { href: '/sample/catalog', label: '商品一覧' },
    { href: '/sample/cart', label: 'カート' },
    { href: '/sample/orders', label: '注文履歴' },
  ];

  const footerLinks = [
    { href: '/sample/privacy', label: 'プライバシーポリシー' },
    { href: '/sample/terms', label: '利用規約' },
  ];

  // 認証が完了するまでローディング表示
  if (!isReady) {
    return (
      <Layout
        headerProps={{
          siteName: 'EC Site',
          navLinks,
          cartCount: 0,
          cartUrl: '/sample/cart',
          homeUrl: '/sample',
          isLoggedIn: false,
          loginHref: '/sample/login',
        }}
        footerProps={{
          copyright: '© 2026 EC Site',
          links: footerLinks,
        }}
      >
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-base-900 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      headerProps={{
        siteName: 'EC Site',
        navLinks,
        cartCount,
        cartUrl: '/sample/cart',
        homeUrl: '/sample',
        isLoggedIn: !!session,
        userName: session?.name,
        loginHref: '/sample/login',
        logoutHref: '/sample/api/auth/logout',
      }}
      footerProps={{
        copyright: '© 2026 EC Site',
        links: footerLinks,
      }}
    >
      {children}
    </Layout>
  );
}
