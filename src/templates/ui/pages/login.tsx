/**
 * ログインページテンプレート
 *
 * 使用例:
 * - 一般ユーザー用ログインページ
 * - 管理者用ログインページ
 *
 * カスタマイズポイント:
 * - title: ページタイトル
 * - apiEndpoint: ログインAPIのエンドポイント
 * - redirectUrl: ログイン成功後のリダイレクト先
 * - roleCheck: ロールチェック関数（管理者用など）
 * - additionalFields: 追加フォームフィールド
 */
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export interface LoginPageProps {
  /** ページタイトル */
  title?: string;
  /** ログインAPIエンドポイント */
  apiEndpoint?: string;
  /** ログイン成功後のリダイレクト先 */
  redirectUrl?: string;
  /** ロールチェック関数（roleを受け取り、許可されていればtrue） */
  roleCheck?: (role: string) => boolean;
  /** ロールエラー時のメッセージ */
  roleErrorMessage?: string;
  /** ログアウトAPIエンドポイント（ロールエラー時に使用） */
  logoutEndpoint?: string;
}

interface LoginResponse {
  success: boolean;
  data?: {
    userId: string;
    role: string;
    name: string;
  };
  error?: {
    message: string;
  };
}

// ─────────────────────────────────────────────────────────────────
// コンポーネント
// ─────────────────────────────────────────────────────────────────

/**
 * 汎用ログインページコンポーネント
 */
export function LoginPage({
  title = 'ログイン',
  apiEndpoint = '/api/auth/login',
  redirectUrl = '/',
  roleCheck,
  roleErrorMessage = '権限がありません',
  logoutEndpoint = '/api/auth/logout',
}: LoginPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await res.json();

      if (data.success && data.data) {
        // ロールチェック
        if (roleCheck && !roleCheck(data.data.role)) {
          setError(roleErrorMessage);
          // 不正なロールでログインした場合はログアウト
          await fetch(logoutEndpoint, { method: 'POST' });
          return;
        }

        router.push(redirectUrl);
        router.refresh();
      } else {
        setError(data.error?.message || 'ログインに失敗しました');
      }
    } catch {
      setError('ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-50 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-3xl font-bold text-base-900">{title}</h1>

        <form onSubmit={handleSubmit} className="rounded-lg border border-base-900/10 bg-white p-8">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-base-900">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-base-900/20 px-4 py-2 text-base-900 focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900"
              placeholder="email@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-base-900">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-base-900/20 px-4 py-2 text-base-900 focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900"
              placeholder="password"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-base-900 px-6 py-3 text-base font-medium text-base-50 hover:bg-base-900/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ロールチェックヘルパー
// ─────────────────────────────────────────────────────────────────

/** 管理者ロールチェック */
export const isAdmin = (role: string): boolean => role === 'admin';

/** 購入者ロールチェック */
export const isBuyer = (role: string): boolean => role === 'buyer';

/** 任意のロールを許可 */
export const allowAny = (): boolean => true;

export default LoginPage;
