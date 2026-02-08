/**
 * APIハンドラテンプレート
 * Next.js Route Handler向けの共通処理を提供
 */
import { NextResponse, type NextRequest } from 'next/server';
import { type ZodSchema } from 'zod';
import { getSession, type SessionData } from '@/foundation/auth/session';
import { handleError, maskErrorForClient, ErrorCode } from '@/foundation/errors/handler';
import { logger } from '@/foundation/logging/logger';
import { recordAudit, type AuditAction } from '@/foundation/logging/audit';

/**
 * APIハンドラ設定
 */
export interface ApiHandlerConfig<TInput, TOutput> {
  /** リクエストボディスキーマ */
  bodySchema?: ZodSchema<TInput>;
  /** レスポンススキーマ */
  responseSchema?: ZodSchema<TOutput>;
  /** 認証が必要か */
  requireAuth?: boolean;
  /** 監査ログ設定 */
  audit?: {
    action: AuditAction;
    targetType: string;
  };
}

/**
 * APIハンドラコンテキスト
 */
export interface ApiHandlerContext<TInput> {
  /** リクエスト */
  request: NextRequest;
  /** パースされたボディ */
  body: TInput;
  /** セッション */
  session: SessionData | null;
  /** パスパラメータ */
  params: Record<string, string>;
}

/**
 * APIハンドラ関数の型
 */
export type ApiHandler<TInput, TOutput> = (
  context: ApiHandlerContext<TInput>
) => Promise<TOutput>;

/**
 * APIハンドラを作成する
 * @param config ハンドラ設定
 * @param handler ハンドラ関数
 * @returns Next.js Route Handler
 */
export function createApiHandler<TInput, TOutput>(
  config: ApiHandlerConfig<TInput, TOutput>,
  handler: ApiHandler<TInput, TOutput>
) {
  return async (
    request: NextRequest,
    { params }: { params: Record<string, string> } = { params: {} }
  ): Promise<NextResponse> => {
    try {
      // 1. セッション取得
      let session: SessionData | null = null;
      if (config.requireAuth !== false) {
        const sessionId = request.cookies.get('sessionId')?.value;
        if (sessionId) {
          session = await getSession(sessionId);
        }

        if (!session) {
          return NextResponse.json(
            { code: ErrorCode.UNAUTHORIZED, message: 'ログインが必要です' },
            { status: 401 }
          );
        }
      }

      // 2. ボディパース
      let body: TInput = {} as TInput;
      if (config.bodySchema && request.method !== 'GET') {
        try {
          const rawBody = await request.json();
          body = config.bodySchema.parse(rawBody);
        } catch (error) {
          logger.warn('Request body validation failed', error);
          return NextResponse.json(
            { code: ErrorCode.VALIDATION_ERROR, message: '入力内容に誤りがあります' },
            { status: 400 }
          );
        }
      }

      // 3. ハンドラ実行
      const context: ApiHandlerContext<TInput> = {
        request,
        body,
        session,
        params,
      };

      const result = await handler(context);

      // 4. 監査ログ
      if (config.audit && session) {
        await recordAudit({
          action: config.audit.action,
          actorId: session.userId,
          targetType: config.audit.targetType,
          targetId: params.id || 'unknown',
        });
      }

      return NextResponse.json(result);
    } catch (error) {
      logger.error('API handler error', error as Error);
      const apiError = maskErrorForClient(error);
      const result = handleError(error);
      return NextResponse.json(apiError, { status: result.httpStatus });
    }
  };
}
