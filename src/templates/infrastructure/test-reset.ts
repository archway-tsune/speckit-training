/**
 * テスト用リセットAPIテンプレート
 *
 * 使用例:
 * - E2Eテスト実行時に状態をリセット
 * - 開発環境でのデータリセット
 *
 * カスタマイズポイント:
 * - resetFunctions: リセット対象のストアをリセットする関数配列
 *
 * 注意:
 * - 本番環境では使用しないこと
 * - NODE_ENV === 'production' 時は404を返す
 */
import { NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

/** リセット関数型 */
export type ResetFunction = () => void | Promise<void>;

/** リセット結果 */
export interface ResetResult {
  success: boolean;
  message?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────
// ハンドラーファクトリ
// ─────────────────────────────────────────────────────────────────

export interface CreateResetHandlerOptions {
  /** リセット対象のストアをリセットする関数配列 */
  resetFunctions: ResetFunction[];
  /** 成功メッセージ */
  successMessage?: string;
  /** 本番環境エラーメッセージ */
  productionErrorMessage?: string;
  /** サーバーエラーメッセージ */
  serverErrorMessage?: string;
}

/**
 * テストリセットハンドラーを生成
 *
 * @example
 * ```typescript
 * // src/app/api/test/reset/route.ts
 * import { createResetHandler } from '@/templates/infrastructure/test-reset';
 * import { resetCartStore } from '@/infrastructure/repositories/cart';
 * import { resetOrderStore } from '@/infrastructure/repositories/order';
 *
 * export const POST = createResetHandler({
 *   resetFunctions: [resetCartStore, resetOrderStore],
 * });
 * ```
 */
export function createResetHandler({
  resetFunctions,
  successMessage = 'All stores reset',
  productionErrorMessage = 'Not available in production',
  serverErrorMessage = 'Reset failed',
}: CreateResetHandlerOptions) {
  return async function POST() {
    // 開発環境のみ有効
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: productionErrorMessage },
        { status: 404 }
      );
    }

    try {
      // すべてのリセット関数を実行
      for (const resetFn of resetFunctions) {
        await resetFn();
      }

      return NextResponse.json({
        success: true,
        message: successMessage,
      });
    } catch (err) {
      console.error('Test reset error:', err);
      return NextResponse.json(
        { error: serverErrorMessage },
        { status: 500 }
      );
    }
  };
}

// ─────────────────────────────────────────────────────────────────
// リセット関数レジストリ
// ─────────────────────────────────────────────────────────────────

/**
 * リセット関数を一元管理するレジストリ
 *
 * @example
 * ```typescript
 * // 各リポジトリでリセット関数を登録
 * resetRegistry.register(resetCartStore);
 * resetRegistry.register(resetOrderStore);
 *
 * // リセットAPIで全てリセット
 * resetRegistry.resetAll();
 * ```
 */
class ResetRegistry {
  private functions: ResetFunction[] = [];

  /**
   * リセット関数を登録
   */
  register(fn: ResetFunction): void {
    this.functions.push(fn);
  }

  /**
   * すべてのリセット関数を実行
   */
  async resetAll(): Promise<void> {
    for (const fn of this.functions) {
      await fn();
    }
  }

  /**
   * 登録をクリア
   */
  clear(): void {
    this.functions = [];
  }

  /**
   * 登録されている関数数を取得
   */
  count(): number {
    return this.functions.length;
  }
}

export const resetRegistry = new ResetRegistry();

export default createResetHandler;
