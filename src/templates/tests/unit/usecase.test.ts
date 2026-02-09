/**
 * ユースケース単体テスト テンプレート
 * TDD: RED → GREEN → REFACTOR
 *
 * このテンプレートは新しいユースケースのテストを書く際の雛形です。
 * 必要に応じてコピーして使用してください。
 *
 * テスト構造:
 * - 正常系: 期待される動作の確認
 * - 異常系: エラーハンドリングの確認
 * - 認可条件: ロールベースのアクセス制御の確認
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- 以下はサンプル実装 ---
// 実際のユースケースに置き換えてください

/**
 * サンプル入力型
 */
interface SampleInput {
  id: string;
  name: string;
}

/**
 * サンプル出力型
 */
interface SampleOutput {
  id: string;
  name: string;
  createdAt: Date;
}

/**
 * サンプルセッション型
 */
interface SampleSession {
  userId: string;
  role: 'buyer' | 'admin';
}

/**
 * サンプルリポジトリ型
 */
interface SampleRepository {
  findById: (id: string) => Promise<SampleOutput | null>;
  create: (data: SampleInput) => Promise<SampleOutput>;
}

/**
 * サンプルユースケース
 */
async function sampleUseCase(
  input: SampleInput,
  session: SampleSession,
  repository: SampleRepository
): Promise<SampleOutput> {
  // 1. 認可チェック
  if (session.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }

  // 2. バリデーション
  if (!input.name || input.name.length === 0) {
    throw new Error('VALIDATION_ERROR');
  }

  // 3. ビジネスロジック
  const result = await repository.create(input);

  return result;
}

// --- テスト本体 ---

describe('[ユースケース名] ユースケース', () => {
  // モックリポジトリ
  let mockRepository: SampleRepository;

  beforeEach(() => {
    // テストごとにモックをリセット
    mockRepository = {
      findById: vi.fn(),
      create: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('正常系', () => {
    it('Given 有効な入力とadminロール, When ユースケース実行, Then 期待される結果が返される', async () => {
      // Arrange - テストデータとモックを準備
      const input: SampleInput = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'テスト',
      };
      const session: SampleSession = {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        role: 'admin',
      };
      const expectedOutput: SampleOutput = {
        id: input.id,
        name: input.name,
        createdAt: new Date(),
      };

      vi.mocked(mockRepository.create).mockResolvedValue(expectedOutput);

      // Act - ユースケースを実行
      const result = await sampleUseCase(input, session, mockRepository);

      // Assert - 結果を検証
      expect(result).toEqual(expectedOutput);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });
  });

  describe('異常系', () => {
    it('Given 無効な入力, When ユースケース実行, Then VALIDATION_ERRORがスローされる', async () => {
      // Arrange
      const input: SampleInput = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: '', // 空の名前
      };
      const session: SampleSession = {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        role: 'admin',
      };

      // Act & Assert
      await expect(sampleUseCase(input, session, mockRepository)).rejects.toThrow(
        'VALIDATION_ERROR'
      );
    });
  });

  describe('認可条件', () => {
    it('Given buyerロール, When admin権限が必要な操作, Then FORBIDDENがスローされる', async () => {
      // Arrange
      const input: SampleInput = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'テスト',
      };
      const session: SampleSession = {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        role: 'buyer', // 権限不足
      };

      // Act & Assert
      await expect(sampleUseCase(input, session, mockRepository)).rejects.toThrow(
        'FORBIDDEN'
      );
    });

    it('Given adminロール, When admin権限が必要な操作, Then 成功する', async () => {
      // Arrange
      const input: SampleInput = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'テスト',
      };
      const session: SampleSession = {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        role: 'admin',
      };
      const expectedOutput: SampleOutput = {
        id: input.id,
        name: input.name,
        createdAt: new Date(),
      };

      vi.mocked(mockRepository.create).mockResolvedValue(expectedOutput);

      // Act & Assert
      await expect(sampleUseCase(input, session, mockRepository)).resolves.toBeDefined();
    });
  });
});
