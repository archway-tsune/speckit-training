/**
 * API統合テスト テンプレート
 * TDD: RED → GREEN → REFACTOR
 *
 * このテンプレートは新しいAPIエンドポイントのテストを書く際の雛形です。
 * 必要に応じてコピーして使用してください。
 *
 * テスト観点:
 * - 契約検証: 入出力スキーマの整合性確認
 * - 認可条件: ロールベースのアクセス制御確認
 * - エラーコード: 適切なエラーレスポンス確認
 * - 状態変更: データの永続化確認
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

// --- 以下はサンプル実装 ---
// 実際のAPIハンドラとスキーマに置き換えてください

/**
 * サンプル入力スキーマ
 */
const SampleInputSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  price: z.number().int().min(0, '価格は0以上で入力してください'),
});

type SampleInput = z.infer<typeof SampleInputSchema>;

/**
 * サンプル出力スキーマ
 */
const SampleOutputSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number(),
  createdAt: z.coerce.date(),
});

type SampleOutput = z.infer<typeof SampleOutputSchema>;

/**
 * エラーレスポンススキーマ
 */
const ErrorResponseSchema = z.object({
  code: z.enum([
    'UNAUTHORIZED',
    'FORBIDDEN',
    'VALIDATION_ERROR',
    'NOT_FOUND',
    'CONFLICT',
    'INTERNAL_ERROR',
  ]),
  message: z.string(),
  fieldErrors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});

/**
 * サンプルセッション
 */
interface MockSession {
  userId: string;
  role: 'buyer' | 'admin';
}

/**
 * モックリクエスト
 */
interface MockRequest {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
  session?: MockSession | null;
}

/**
 * モックレスポンス
 */
interface MockResponse {
  status: number;
  body: unknown;
}

/**
 * サンプルAPIハンドラ（テスト対象）
 */
async function sampleApiHandler(req: MockRequest): Promise<MockResponse> {
  // 1. 認証チェック
  if (!req.session) {
    return {
      status: 401,
      body: { code: 'UNAUTHORIZED', message: 'ログインが必要です' },
    };
  }

  // 2. 認可チェック
  if (req.session.role !== 'admin') {
    return {
      status: 403,
      body: { code: 'FORBIDDEN', message: 'この操作を行う権限がありません' },
    };
  }

  // 3. バリデーション
  const parseResult = SampleInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return {
      status: 400,
      body: {
        code: 'VALIDATION_ERROR',
        message: '入力内容に誤りがあります',
        fieldErrors: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    };
  }

  // 4. ビジネスロジック
  const output: SampleOutput = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: parseResult.data.name,
    price: parseResult.data.price,
    createdAt: new Date(),
  };

  return {
    status: 200,
    body: output,
  };
}

// --- テスト本体 ---

describe('[エンドポイント] API統合テスト', () => {
  // テストヘルパー
  const createSession = (role: 'buyer' | 'admin'): MockSession => ({
    userId: '550e8400-e29b-41d4-a716-446655440001',
    role,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('契約検証', () => {
    it('レスポンスが出力スキーマに準拠している', async () => {
      // Arrange
      const request: MockRequest = {
        body: { name: 'テスト商品', price: 1000 },
        session: createSession('admin'),
      };

      // Act
      const response = await sampleApiHandler(request);

      // Assert
      expect(response.status).toBe(200);
      const parseResult = SampleOutputSchema.safeParse(response.body);
      expect(parseResult.success).toBe(true);
    });

    it('エラーレスポンスがエラースキーマに準拠している', async () => {
      // Arrange
      const request: MockRequest = {
        body: { name: '', price: -1 }, // 無効な入力
        session: createSession('admin'),
      };

      // Act
      const response = await sampleApiHandler(request);

      // Assert
      expect(response.status).toBe(400);
      const parseResult = ErrorResponseSchema.safeParse(response.body);
      expect(parseResult.success).toBe(true);
    });
  });

  describe('認可条件', () => {
    it('未認証ユーザーは401エラー', async () => {
      // Arrange
      const request: MockRequest = {
        body: { name: 'テスト商品', price: 1000 },
        session: null, // 未認証
      };

      // Act
      const response = await sampleApiHandler(request);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('buyerロールは403エラー（admin権限必要）', async () => {
      // Arrange
      const request: MockRequest = {
        body: { name: 'テスト商品', price: 1000 },
        session: createSession('buyer'),
      };

      // Act
      const response = await sampleApiHandler(request);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
      });
    });

    it('adminロールはアクセス可能', async () => {
      // Arrange
      const request: MockRequest = {
        body: { name: 'テスト商品', price: 1000 },
        session: createSession('admin'),
      };

      // Act
      const response = await sampleApiHandler(request);

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('エラーコード検証', () => {
    it('バリデーションエラー時はVALIDATION_ERRORとフィールドエラー', async () => {
      // Arrange
      const request: MockRequest = {
        body: { name: '', price: -1 },
        session: createSession('admin'),
      };

      // Act
      const response = await sampleApiHandler(request);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'VALIDATION_ERROR',
      });
      expect((response.body as { fieldErrors?: unknown[] }).fieldErrors).toBeDefined();
      expect(
        (response.body as { fieldErrors: unknown[] }).fieldErrors.length
      ).toBeGreaterThan(0);
    });
  });

  describe('正常系', () => {
    it('有効な入力で正常にリソースが作成される', async () => {
      // Arrange
      const request: MockRequest = {
        body: { name: 'テスト商品', price: 1000 },
        session: createSession('admin'),
      };

      // Act
      const response = await sampleApiHandler(request);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: 'テスト商品',
        price: 1000,
      });
    });
  });
});
