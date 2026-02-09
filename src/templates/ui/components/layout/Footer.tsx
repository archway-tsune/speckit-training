/**
 * Footer コンポーネント
 * 共通フッターコンポーネント
 */
import React from 'react';

export interface FooterLink {
  href: string;
  label: string;
}

export interface FooterProps {
  /** コピーライト表記 */
  copyright?: string;
  /** フッターリンク */
  links?: FooterLink[];
}

/**
 * フッターコンポーネント
 */
export function Footer({
  copyright = `© ${new Date().getFullYear()} EC Site`,
  links = [],
}: FooterProps) {
  return (
    <footer role="contentinfo" className="border-t border-base-900/10 bg-base-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* コピーライト */}
          <p className="text-sm text-base-900/60">{copyright}</p>

          {/* フッターリンク */}
          {links.length > 0 && (
            <nav className="flex gap-6" aria-label="フッターナビゲーション">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-base-900/60 hover:text-base-900"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}
