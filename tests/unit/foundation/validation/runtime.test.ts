/**
 * Runtime Validation 単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  validate,
  validateAsync,
  ValidationError,
} from '@/foundation/validation/runtime';

describe('Runtime Validation', () => {
  const TestSchema = z.object({
    name: z.string().min(1, '名前は必須です'),
    age: z.number().int().min(0, '年齢は0以上で入力してください'),
  });

  describe('validate - 同期バリデーション', () => {
    describe('正常系', () => {
      it('Given 有効なデータ, When バリデーション, Then データが返される', () => {
        // Arrange
        const input = { name: 'テスト', age: 25 };

        // Act
        const result = validate(TestSchema, input);

        // Assert
        expect(result).toEqual(input);
      });

      it('Given 型変換が必要なデータ, When バリデーション, Then 変換されたデータが返される', () => {
        // Arrange
        const schema = z.object({
          count: z.coerce.number(),
        });
        const input = { count: '42' };

        // Act
        const result = validate(schema, input);

        // Assert
        expect(result.count).toBe(42);
      });
    });

    describe('異常系', () => {
      it('Given 無効なデータ, When バリデーション, Then ValidationErrorがスローされる', () => {
        // Arrange
        const input = { name: '', age: 25 };

        // Act & Assert
        expect(() => validate(TestSchema, input)).toThrow(ValidationError);
      });

      it('Given 無効なデータ, When バリデーション, Then フィールドエラーが含まれる', () => {
        // Arrange
        const input = { name: '', age: -1 };

        // Act & Assert
        try {
          validate(TestSchema, input);
          expect.fail('エラーがスローされるべき');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;
          expect(validationError.fieldErrors.length).toBeGreaterThan(0);
        }
      });

      it('Given 型が不正なデータ, When バリデーション, Then ValidationErrorがスローされる', () => {
        // Arrange
        const input = { name: 123, age: 'invalid' };

        // Act & Assert
        expect(() => validate(TestSchema, input)).toThrow(ValidationError);
      });
    });
  });

  describe('validateAsync - 非同期バリデーション', () => {
    describe('正常系', () => {
      it('Given 有効なデータ, When 非同期バリデーション, Then データが返される', async () => {
        // Arrange
        const input = { name: 'テスト', age: 25 };

        // Act
        const result = await validateAsync(TestSchema, input);

        // Assert
        expect(result).toEqual(input);
      });
    });

    describe('異常系', () => {
      it('Given 無効なデータ, When 非同期バリデーション, Then ValidationErrorがスローされる', async () => {
        // Arrange
        const input = { name: '', age: 25 };

        // Act & Assert
        await expect(validateAsync(TestSchema, input)).rejects.toThrow(ValidationError);
      });
    });
  });
});
