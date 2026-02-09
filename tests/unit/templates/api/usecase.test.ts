/**
 * ユースケーステンプレート 単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  createUseCase,
  type UseCaseConfig,
  type UseCaseContext,
} from '@/templates/api/usecase';

describe('ユースケーステンプレート', () => {
  // サンプルスキーマ
  const InputSchema = z.object({
    name: z.string().min(1),
    value: z.number(),
  });

  const OutputSchema = z.object({
    id: z.string(),
    name: z.string(),
    value: z.number(),
  });

  // サンプルセッション
  const buyerSession = { userId: 'user-1', role: 'buyer' as const };
  const adminSession = { userId: 'admin-1', role: 'admin' as const };

  describe('createUseCase - ユースケース生成', () => {
    it('Given 有効な入力, When ユースケース実行, Then 結果が返される', async () => {
      // Arrange
      const config: UseCaseConfig<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
        inputSchema: InputSchema,
        outputSchema: OutputSchema,
        requiredRole: 'buyer',
        execute: async (input) => ({
          id: 'generated-id',
          name: input.name,
          value: input.value,
        }),
      };

      const useCase = createUseCase(config);
      const context: UseCaseContext = { session: buyerSession };

      // Act
      const result = await useCase({ name: 'テスト', value: 100 }, context);

      // Assert
      expect(result.id).toBe('generated-id');
      expect(result.name).toBe('テスト');
      expect(result.value).toBe(100);
    });

    it('Given 無効な入力, When ユースケース実行, Then ValidationErrorがスローされる', async () => {
      // Arrange
      const config: UseCaseConfig<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
        inputSchema: InputSchema,
        outputSchema: OutputSchema,
        requiredRole: 'buyer',
        execute: async (input) => ({
          id: 'generated-id',
          name: input.name,
          value: input.value,
        }),
      };

      const useCase = createUseCase(config);
      const context: UseCaseContext = { session: buyerSession };

      // Act & Assert
      await expect(useCase({ name: '', value: 100 }, context)).rejects.toThrow('VALIDATION_ERROR');
    });

    it('Given 権限不足, When ユースケース実行, Then ForbiddenErrorがスローされる', async () => {
      // Arrange
      const config: UseCaseConfig<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
        inputSchema: InputSchema,
        outputSchema: OutputSchema,
        requiredRole: 'admin',
        execute: async (input) => ({
          id: 'generated-id',
          name: input.name,
          value: input.value,
        }),
      };

      const useCase = createUseCase(config);
      const context: UseCaseContext = { session: buyerSession };

      // Act & Assert
      await expect(useCase({ name: 'テスト', value: 100 }, context)).rejects.toThrow('FORBIDDEN');
    });

    it('Given admin権限, When admin必須のユースケース実行, Then 成功する', async () => {
      // Arrange
      const config: UseCaseConfig<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
        inputSchema: InputSchema,
        outputSchema: OutputSchema,
        requiredRole: 'admin',
        execute: async (input) => ({
          id: 'generated-id',
          name: input.name,
          value: input.value,
        }),
      };

      const useCase = createUseCase(config);
      const context: UseCaseContext = { session: adminSession };

      // Act
      const result = await useCase({ name: 'テスト', value: 100 }, context);

      // Assert
      expect(result.id).toBe('generated-id');
    });

    it('Given 複数ロール許可, When いずれかのロール, Then 成功する', async () => {
      // Arrange
      const config: UseCaseConfig<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
        inputSchema: InputSchema,
        outputSchema: OutputSchema,
        requiredRole: ['buyer', 'admin'],
        execute: async (input) => ({
          id: 'generated-id',
          name: input.name,
          value: input.value,
        }),
      };

      const useCase = createUseCase(config);
      const context: UseCaseContext = { session: buyerSession };

      // Act
      const result = await useCase({ name: 'テスト', value: 100 }, context);

      // Assert
      expect(result.id).toBe('generated-id');
    });
  });
});
