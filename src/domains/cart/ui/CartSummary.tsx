'use client';

/**
 * CartSummary コンポーネント
 * 合計セクション — 商品合計・消費税（10%、端数切り捨て）・総合計を表示
 */
import React from 'react';
import Link from 'next/link';
import { calculateTax } from '@/domains/cart/types';

export interface CartSummaryProps {
  subtotal: number;
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

export function CartSummary({ subtotal }: CartSummaryProps) {
  const { tax, total } = calculateTax(subtotal);

  return (
    <div className="mt-6 border-t border-base-900/10 pt-6">
      <div className="space-y-2">
        <div className="flex justify-between text-base-900/60">
          <span>商品合計</span>
          <span data-testid="cart-subtotal">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-base-900/60">
          <span>消費税（10%）</span>
          <span data-testid="cart-tax">{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-base-900">
          <span>総合計</span>
          <span data-testid="cart-total">{formatPrice(total)}</span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="mt-6 block w-full rounded-md bg-base-900 px-6 py-3 text-center text-base font-medium text-base-50 hover:bg-base-900/90"
      >
        注文手続きへ
      </Link>
    </div>
  );
}
