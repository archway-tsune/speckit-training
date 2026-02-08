'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.data.role !== 'admin') {
          setError('管理者権限がありません');
          await fetch('/api/auth/logout', { method: 'POST' });
        } else {
          router.push('/admin');
          router.refresh();
        }
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
        <h1 className="mb-8 text-center text-3xl font-bold text-base-900">管理者ログイン</h1>

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
              placeholder="admin@example.com"
              required
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
