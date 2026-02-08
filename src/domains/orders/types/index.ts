/**
 * Orders ドメイン - ステートマシンヘルパー
 * ValidStatusTransitions マップに基づくステータス遷移ユーティリティ
 */
import { ValidStatusTransitions, type OrderStatus } from '@/contracts/orders';

/**
 * 指定ステータスから遷移可能なステータス一覧を返す
 */
export function getValidTransitions(currentStatus: OrderStatus): OrderStatus[] {
  return ValidStatusTransitions[currentStatus];
}

/**
 * 指定ステータスから目標ステータスへ遷移可能かどうかを判定する
 */
export function canTransitionTo(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  return ValidStatusTransitions[currentStatus].includes(targetStatus);
}

/**
 * 指定ステータスが最終状態（遷移先がない）かどうかを判定する
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return ValidStatusTransitions[status].length === 0;
}
