'use client';

import { Layout } from '@/templates/ui/components/layout/Layout';
import { Loading } from '@/templates/ui/components/status/Loading';
import { Error } from '@/templates/ui/components/status/Error';
import { Empty } from '@/templates/ui/components/status/Empty';

export default function Home() {
  const navLinks = [
    { href: '/sample/catalog', label: '商品一覧' },
    { href: '/sample/cart', label: 'カート' },
    { href: '/sample/orders', label: '注文履歴' },
  ];

  const footerLinks = [
    { href: '/sample/privacy', label: 'プライバシーポリシー' },
    { href: '/sample/terms', label: '利用規約' },
    { href: '/sample/contact', label: 'お問い合わせ' },
  ];

  return (
    <Layout
      headerProps={{
        siteName: 'EC Site',
        navLinks,
        cartCount: 3,
        isLoggedIn: true,
        userName: 'テストユーザー',
      }}
      footerProps={{
        copyright: '© 2026 EC Site',
        links: footerLinks,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold">ECサイト向けアーキテクチャ基盤</h1>

        {/* コンポーネントデモ */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">状態表示コンポーネント</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-base-900/10 bg-white p-4">
              <h3 className="mb-2 text-sm font-medium text-base-900/60">Loading</h3>
              <Loading message="データを読み込み中..." size="md" />
            </div>
            <div className="rounded-lg border border-base-900/10 bg-white p-4">
              <h3 className="mb-2 text-sm font-medium text-base-900/60">Error</h3>
              <Error
                message="データの取得に失敗しました"
                title="エラー"
                onRetry={() => alert('リトライ')}
              />
            </div>
            <div className="rounded-lg border border-base-900/10 bg-white p-4">
              <h3 className="mb-2 text-sm font-medium text-base-900/60">Empty</h3>
              <Empty
                message="カートは空です"
                actionLabel="買い物を続ける"
                onAction={() => alert('買い物を続ける')}
              />
            </div>
          </div>
        </section>

        {/* ボタンデモ */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">ボタン</h2>
          <div className="flex gap-4">
            <button className="rounded-md bg-base-900 px-6 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90">
              プライマリ
            </button>
            <button className="rounded-md border border-base-900/20 px-6 py-2 text-sm font-medium text-base-900 hover:bg-base-100">
              セカンダリ
            </button>
            <button className="rounded-md bg-accent px-6 py-2 text-sm font-medium text-base-900 hover:bg-accent-hover">
              アクセント
            </button>
            <button
              className="rounded-md bg-base-900 px-6 py-2 text-sm font-medium text-base-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled
            >
              無効
            </button>
          </div>
        </section>

        {/* カードデモ */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">カード</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-base-900/10 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 aspect-square rounded-md bg-base-100" />
                <h3 className="text-lg font-semibold">商品名 {i}</h3>
                <p className="mt-2 text-base-900/70">
                  商品の説明文がここに入ります。ミニマルなデザインで商品情報を表示します。
                </p>
                <p className="mt-4 text-xl font-bold">¥1,000</p>
                <button className="mt-4 w-full rounded-md bg-base-900 px-6 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90">
                  カートに追加
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 入力フィールドデモ */}
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">入力フィールド</h2>
          <div className="max-w-md space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-base-900">
                テキスト入力
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-base-900/20 px-4 py-2 text-base-900 placeholder:text-base-900/40 focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900"
                placeholder="入力してください"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-base-900">
                セレクト
              </label>
              <select className="w-full rounded-md border border-base-900/20 px-4 py-2 text-base-900 focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900">
                <option>選択してください</option>
                <option>オプション1</option>
                <option>オプション2</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-base-900">
                テキストエリア
              </label>
              <textarea
                className="w-full rounded-md border border-base-900/20 px-4 py-2 text-base-900 placeholder:text-base-900/40 focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900"
                placeholder="入力してください"
                rows={3}
              />
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
