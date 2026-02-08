/**
 * 監査フック
 * ECサイト向けアーキテクチャ基盤 - 監査ログ拡張点
 */
import { logger } from './logger';

/**
 * 監査アクション種別
 */
export const AuditAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  STATUS_CHANGE: 'status_change',
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

/**
 * 監査ログエントリ
 */
export interface AuditLogEntry {
  /** 操作種別 */
  action: AuditAction;
  /** 実行者（ユーザーID） */
  actorId: string;
  /** 操作対象の種類 */
  targetType: string;
  /** 操作対象の識別子 */
  targetId: string;
  /** 追加情報（個人情報除外） */
  details?: Record<string, unknown>;
  /** 実行日時 */
  timestamp: Date;
}

/**
 * 監査フックのコールバック型
 */
export type AuditHook = (entry: AuditLogEntry) => Promise<void> | void;

/**
 * 登録された監査フック
 */
const auditHooks: AuditHook[] = [];

/**
 * 監査フックを登録する
 * @param hook 監査フックコールバック
 * @returns 登録解除関数
 */
export function registerAuditHook(hook: AuditHook): () => void {
  auditHooks.push(hook);
  return () => {
    const index = auditHooks.indexOf(hook);
    if (index > -1) {
      auditHooks.splice(index, 1);
    }
  };
}

/**
 * 監査ログを記録する
 * @param entry 監査ログエントリ（timestampは自動設定）
 */
export async function recordAudit(
  entry: Omit<AuditLogEntry, 'timestamp'>
): Promise<void> {
  const fullEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date(),
  };

  // デフォルトのログ出力
  logger.info('Audit log', {
    action: fullEntry.action,
    actorId: fullEntry.actorId,
    targetType: fullEntry.targetType,
    targetId: fullEntry.targetId,
    details: fullEntry.details,
  });

  // 登録されたフックを実行
  for (const hook of auditHooks) {
    try {
      await hook(fullEntry);
    } catch (error) {
      logger.error('Audit hook failed', error as Error);
    }
  }
}

/**
 * 監査フックをすべてクリアする（テスト用）
 */
export function clearAuditHooks(): void {
  auditHooks.length = 0;
}
