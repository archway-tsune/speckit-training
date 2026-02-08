import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EC Site',
  description: 'ECサイト向けアーキテクチャ基盤',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-base-50 text-base-900">{children}</body>
    </html>
  );
}
