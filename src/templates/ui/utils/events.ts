/**
 * カスタムイベントユーティリティ
 *
 * 使用例:
 * - コンポーネント間の状態同期（カート更新など）
 * - グローバルなイベント通知
 *
 * カスタマイズポイント:
 * - イベント名
 * - イベントペイロード型
 */

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

/** イベントハンドラ型 */
export type EventHandler<T = unknown> = (data: T) => void;

// ─────────────────────────────────────────────────────────────────
// 汎用イベントディスパッチャ
// ─────────────────────────────────────────────────────────────────

/**
 * カスタムイベントを発火
 *
 * @example
 * ```typescript
 * // カート更新イベントを発火
 * dispatchCustomEvent('cart-updated', { itemCount: 5 });
 * ```
 */
export function dispatchCustomEvent<T = unknown>(
  eventName: string,
  detail?: T
): void {
  if (typeof window === 'undefined') return;

  const event = new CustomEvent(eventName, { detail });
  window.dispatchEvent(event);
}

/**
 * カスタムイベントリスナーを登録
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeCustomEvent('cart-updated', (data) => {
 *   console.log('Cart updated:', data);
 * });
 *
 * // クリーンアップ
 * unsubscribe();
 * ```
 */
export function subscribeCustomEvent<T = unknown>(
  eventName: string,
  handler: EventHandler<T>
): () => void {
  if (typeof window === 'undefined') return () => {};

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<T>;
    handler(customEvent.detail);
  };

  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}

// ─────────────────────────────────────────────────────────────────
// 定義済みイベント
// ─────────────────────────────────────────────────────────────────

/** カート更新イベント */
export const CART_UPDATED_EVENT = 'cart-updated';

/** 注文完了イベント */
export const ORDER_COMPLETED_EVENT = 'order-completed';

/** ログインイベント */
export const LOGIN_EVENT = 'user-login';

/** ログアウトイベント */
export const LOGOUT_EVENT = 'user-logout';

// ─────────────────────────────────────────────────────────────────
// 定義済みイベント用ヘルパー
// ─────────────────────────────────────────────────────────────────

/** カート更新イベントペイロード */
export interface CartUpdatedPayload {
  itemCount?: number;
  action?: 'add' | 'remove' | 'update' | 'clear';
  productId?: string;
}

/**
 * カート更新イベントを発火
 */
export function dispatchCartUpdated(payload?: CartUpdatedPayload): void {
  dispatchCustomEvent(CART_UPDATED_EVENT, payload);
}

/**
 * カート更新イベントを購読
 */
export function subscribeCartUpdated(
  handler: EventHandler<CartUpdatedPayload | undefined>
): () => void {
  return subscribeCustomEvent(CART_UPDATED_EVENT, handler);
}

/** 注文完了イベントペイロード */
export interface OrderCompletedPayload {
  orderId: string;
}

/**
 * 注文完了イベントを発火
 */
export function dispatchOrderCompleted(payload: OrderCompletedPayload): void {
  dispatchCustomEvent(ORDER_COMPLETED_EVENT, payload);
}

/**
 * 注文完了イベントを購読
 */
export function subscribeOrderCompleted(
  handler: EventHandler<OrderCompletedPayload>
): () => void {
  return subscribeCustomEvent(ORDER_COMPLETED_EVENT, handler);
}

export default {
  dispatchCustomEvent,
  subscribeCustomEvent,
  dispatchCartUpdated,
  subscribeCartUpdated,
  dispatchOrderCompleted,
  subscribeOrderCompleted,
};
