'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface SessionData {
  userId: string;
  role: 'buyer' | 'admin';
  name: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // ログイン関連ページはレイアウトチェックをスキップ
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/logout';

  const checkSession = useCallback(async () => {
    if (isAuthPage) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.data.role !== 'admin') {
            setAccessDenied(true);
          } else {
            setSession(data.data);
          }
        } else {
          router.push('/admin/login');
        }
      } else {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, isAuthPage]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // ログイン関連ページは直接表示
  if (isAuthPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-base-900/60">読み込み中...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">権限がありません</p>
          <Link
            href="/login"
            className="mt-4 inline-block text-base-900 underline hover:no-underline"
          >
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: '/admin/orders', label: '注文管理' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* サイドバー */}
      <aside className="w-64 bg-base-900 text-base-50">
        <div className="p-6">
          <h1 className="text-xl font-bold">EC Site 管理</h1>
          <p className="mt-1 text-sm text-base-50/70">{session?.name}</p>
        </div>
        <nav className="px-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`mb-1 block rounded-md px-4 py-2 text-sm ${
                pathname === link.href
                  ? 'bg-base-50/10 font-medium'
                  : 'hover:bg-base-50/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4">
          <Link
            href="/admin/logout"
            className="block rounded-md px-4 py-2 text-sm text-base-50/70 hover:bg-base-50/5"
          >
            ログアウト
          </Link>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 bg-base-50 p-8">{children}</main>
    </div>
  );
}
