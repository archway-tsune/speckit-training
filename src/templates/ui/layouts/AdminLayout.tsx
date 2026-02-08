/**
 * 管理者レイアウトテンプレート
 *
 * 使用例:
 * - 管理者用ダッシュボード
 * - 商品管理・注文管理などのバックオフィス画面
 *
 * カスタマイズポイント:
 * - navLinks: サイドバーのナビゲーションリンク
 * - sessionEndpoint: セッション確認APIのエンドポイント
 * - loginPath: ログインページのパス
 * - logoutPath: ログアウトページのパス
 * - requiredRole: 必要なロール
 * - siteName: サイト名（サイドバーヘッダー）
 */
'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export interface NavLink {
  href: string;
  label: string;
  icon?: ReactNode;
}

export interface SessionData {
  userId: string;
  role: string;
  name: string;
}

export interface AdminLayoutProps {
  children: ReactNode;
  /** サイト名 */
  siteName?: string;
  /** ナビゲーションリンク */
  navLinks?: NavLink[];
  /** セッション確認APIエンドポイント */
  sessionEndpoint?: string;
  /** ログインページパス */
  loginPath?: string;
  /** ログアウトページパス */
  logoutPath?: string;
  /** 必要なロール */
  requiredRole?: string;
  /** 権限なしメッセージ */
  accessDeniedMessage?: string;
  /** 認証ページパスパターン（レイアウトチェックをスキップ） */
  authPathPattern?: RegExp;
}

// ─────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────

/**
 * 管理者用レイアウトコンポーネント
 * セッションチェックとロールベースアクセス制御を提供
 */
export function AdminLayout({
  children,
  siteName = '管理画面',
  navLinks = [],
  sessionEndpoint = '/api/auth/session',
  loginPath = '/admin/login',
  logoutPath = '/admin/logout',
  requiredRole = 'admin',
  accessDeniedMessage = '権限がありません',
  authPathPattern = /\/(login|logout)$/,
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // ログイン関連ページはレイアウトチェックをスキップ
  const isAuthPage = authPathPattern.test(pathname);

  const checkSession = useCallback(async () => {
    if (isAuthPage) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(sessionEndpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.data.role !== requiredRole) {
            setAccessDenied(true);
          } else {
            setSession(data.data);
          }
        } else {
          router.push(loginPath);
        }
      } else {
        router.push(loginPath);
      }
    } catch {
      router.push(loginPath);
    } finally {
      setIsLoading(false);
    }
  }, [router, isAuthPage, sessionEndpoint, loginPath, requiredRole]);

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
          <p className="text-lg text-red-600">{accessDeniedMessage}</p>
          <Link
            href={loginPath}
            className="mt-4 inline-block text-base-900 underline hover:no-underline"
          >
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* サイドバー */}
      <aside className="w-64 bg-base-900 text-base-50">
        <div className="p-6">
          <h1 className="text-xl font-bold">{siteName}</h1>
          <p className="mt-1 text-sm text-base-50/70">{session?.name}</p>
        </div>
        <nav className="px-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`mb-1 flex items-center gap-2 rounded-md px-4 py-2 text-sm ${
                pathname === link.href
                  ? 'bg-base-50/10 font-medium'
                  : 'hover:bg-base-50/5'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4">
          <Link
            href={logoutPath}
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

export default AdminLayout;
