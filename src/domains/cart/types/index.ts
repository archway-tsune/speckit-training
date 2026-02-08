/**
 * カートドメイン — 型定義
 */

/**
 * 消費税計算結果
 */
export interface TaxCalculation {
  /** 商品合計（税抜） */
  subtotal: number;
  /** 消費税（10%、端数切り捨て） */
  tax: number;
  /** 総合計（税込） */
  total: number;
}

/**
 * 消費税を計算する（10%、端数切り捨て）
 */
export function calculateTax(subtotal: number): TaxCalculation {
  const tax = Math.floor(subtotal * 0.1);
  return {
    subtotal,
    tax,
    total: subtotal + tax,
  };
}
