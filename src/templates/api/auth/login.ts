/**
 * ログインAPIテンプレート
 *
 * 使用例:
 * - POST /api/auth/login
 *
 * カスタマイズポイント:
 * - authenticateUser: ユーザー認証ロジック
 * - createSession: セッション作成ロジック
 * - responseShape: レスポンスデータ形状
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { success, error } from '@/foundation/errors/response';
import { ErrorCode } from '@/foundation/errors/types';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

/** ログイン入力スキーマ */
export const LoginInputSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

/** 認証結果 */
export interface AuthResult {
  userId: string;
  role: string;
  name: string;
}

/** 認証関数インターフェース */
export interface Authenticator {
  authenticate(email: string, password: string): Promise<AuthResult | null>;
}

/** セッション作成関数インターフェース */
export interface SessionCreator {
  createSession(authResult: AuthResult): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────
// ハンドラーファクトリ
// ─────────────────────────────────────────────────────────────────

export interface CreateLoginHandlerOptions {
  authenticator: Authenticator;
  sessionCreator: SessionCreator;
  /** バリデーションエラーメッセージ */
  validationErrorMessage?: string;
  /** 認証エラーメッセージ */
  authErrorMessage?: string;
  /** サーバーエラーメッセージ */
  serverErrorMessage?: string;
}

/**
 * ログインハンドラーを生成
 */
export function createLoginHandler({
  authenticator,
  sessionCreator,
  validationErrorMessage = '入力内容に誤りがあります',
  authErrorMessage = 'メールアドレスまたはパスワードが正しくありません',
  serverErrorMessage = 'ログインに失敗しました',
}: CreateLoginHandlerOptions) {
  return async function POST(request: NextRequest) {
    try {
      // リクエストボディをパース
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          error(ErrorCode.VALIDATION_ERROR, validationErrorMessage),
          { status: 400 }
        );
      }

      // バリデーション
      const result = LoginInputSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          error(ErrorCode.VALIDATION_ERROR, validationErrorMessage),
          { status: 400 }
        );
      }

      const { email, password } = result.data;

      // 認証
      const authResult = await authenticator.authenticate(email, password);
      if (!authResult) {
        return NextResponse.json(
          error(ErrorCode.UNAUTHORIZED, authErrorMessage),
          { status: 401 }
        );
      }

      // セッション作成
      await sessionCreator.createSession(authResult);

      return NextResponse.json(
        success({
          userId: authResult.userId,
          role: authResult.role,
          name: authResult.name,
        })
      );
    } catch (err) {
      console.error('POST /api/auth/login error:', err);
      return NextResponse.json(
        error(ErrorCode.INTERNAL_ERROR, serverErrorMessage),
        { status: 500 }
      );
    }
  };
}

// ─────────────────────────────────────────────────────────────────
// デモ実装例
// ─────────────────────────────────────────────────────────────────

/**
 * デモ用認証（本番では使用しないこと）
 * メールアドレスにadminを含む場合は管理者として認証
 */
export const demoAuthenticator: Authenticator = {
  async authenticate(email: string, _password: string): Promise<AuthResult | null> {
    // デモ用：常に成功
    const isAdmin = email.includes('admin');
    return {
      userId: isAdmin ? 'admin-demo-001' : 'buyer-demo-001',
      role: isAdmin ? 'admin' : 'buyer',
      name: isAdmin ? '管理者テスト' : '購入者テスト',
    };
  },
};

export default createLoginHandler;
