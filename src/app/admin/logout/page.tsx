'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    };
    logout();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-base-900/60">ログアウト中...</p>
    </div>
  );
}
