/**
 * Orders UI 共通ヘルパー
 * statusLabels / statusColors / formatPrice / formatDate / formatDateTime
 */
import type { Order } from '@/contracts/orders';

export const statusLabels: Record<Order['status'], string> = {
  pending: '処理待ち',
  confirmed: '確定済み',
  shipped: '発送済み',
  delivered: '配達完了',
  cancelled: 'キャンセル',
};

export const statusColors: Record<Order['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
