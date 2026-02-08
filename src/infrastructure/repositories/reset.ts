/**
 * リポジトリ状態リセット
 * テスト用：全てのインメモリストアをクリア
 */

// 直接 Map インスタンスにアクセスするため、各リポジトリから export された
// クリア関数を呼び出す

// カートストアをクリア
import { resetCartStore } from './cart';
// 注文ストアをクリア
import { resetOrderStore } from './order';

/**
 * 全てのインメモリストアをリセット
 */
export function resetAllStores(): void {
  resetCartStore();
  resetOrderStore();
}
