/**
 * セッション管理
 * ECサイト向けアーキテクチャ基盤 - 認証基盤
 */
import { z } from 'zod';

/**
 * ロール定義
 */
export const RoleSchema = z.enum(['buyer', 'admin']);
export type Role = z.infer<typeof RoleSchema>;

/**
 * セッションデータ（最小限の情報のみ保持）
 */
export const SessionDataSchema = z.object({
  userId: z.string().uuid(),
  role: RoleSchema,
});
export type SessionData = z.infer<typeof SessionDataSchema>;

/**
 * セッション生成入力
 */
const CreateSessionInputSchema = z.object({
  userId: z.string().min(1, 'ユーザーIDは必須です').uuid('有効なUUID形式で入力してください'),
  role: RoleSchema,
});

// インメモリセッションストア（本番では外部ストアに置き換え）
const sessionStore = new Map<string, { data: SessionData; expiresAt: Date }>();

/**
 * セキュアなセッションIDを生成
 */
function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * セッションを生成する
 * @param input ユーザーID・ロール
 * @returns セッションデータ
 */
export async function createSession(input: {
  userId: string;
  role: Role;
}): Promise<SessionData> {
  // バリデーション
  const validated = CreateSessionInputSchema.parse(input);

  const sessionData: SessionData = {
    userId: validated.userId,
    role: validated.role,
  };

  // セッションIDを生成してストアに保存
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

  sessionStore.set(sessionId, { data: sessionData, expiresAt });

  return sessionData;
}

/**
 * セッションを取得する
 * @param sessionId セッションID
 * @returns セッションデータ、無効な場合はnull
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const session = sessionStore.get(sessionId);

  if (!session) {
    return null;
  }

  // 有効期限チェック
  if (session.expiresAt < new Date()) {
    sessionStore.delete(sessionId);
    return null;
  }

  return session.data;
}

/**
 * セッションを破棄する
 * @param sessionId セッションID
 */
export async function destroySession(sessionId: string): Promise<void> {
  sessionStore.delete(sessionId);
}

/**
 * セッションが有効かどうかを確認する
 * @param session セッションデータ
 * @returns 有効な場合true
 */
export function isSessionValid(session: SessionData | null | undefined): session is SessionData {
  if (!session) {
    return false;
  }

  const result = SessionDataSchema.safeParse(session);
  return result.success;
}

/**
 * 未認証時のエラー
 */
export class UnauthorizedError extends Error {
  constructor(message = 'ログインが必要です') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * セッションを検証し、無効な場合はエラーをスローする
 * @param session セッションデータ
 * @returns 検証済みセッションデータ
 * @throws UnauthorizedError セッションが無効な場合
 */
export function requireSession(session: SessionData | null | undefined): SessionData {
  if (!isSessionValid(session)) {
    throw new UnauthorizedError();
  }
  return session;
}

/**
 * セッション型（エイリアス）
 * SessionData に expiresAt を追加した拡張型
 */
export interface Session extends SessionData {
  expiresAt: Date;
}
