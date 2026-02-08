/**
 * DTO統合テスト
 * DTOスキーマの実際のパース・バリデーション挙動を検証
 */
import { describe, it, expect } from 'vitest';
import {
  UuidSchema,
  DateSchema,
  PaginationInputSchema,
  PaginationOutputSchema,
  BaseEntitySchema,
  createListOutputSchema,
  CreateSampleInputSchema,
  UpdateSampleInputSchema,
  GetSampleListInputSchema,
  GetSampleListOutputSchema,
  SampleEntitySchema,
} from '@/templates/api/dto';
import { z } from 'zod';

describe('DTO統合テスト', () => {
  describe('共通スキーマ', () => {
    describe('UuidSchema', () => {
      it('正しいUUID形式を受け入れる', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        expect(UuidSchema.parse(validUuid)).toBe(validUuid);
      });

      it('不正なUUID形式を拒否する', () => {
        expect(() => UuidSchema.parse('invalid-uuid')).toThrow();
        expect(() => UuidSchema.parse('12345')).toThrow();
        expect(() => UuidSchema.parse('')).toThrow();
      });
    });

    describe('DateSchema', () => {
      it('ISO日付文字列をDateに変換する', () => {
        const isoString = '2024-01-15T10:30:00.000Z';
        const result = DateSchema.parse(isoString);
        expect(result).toBeInstanceOf(Date);
        expect(result.toISOString()).toBe(isoString);
      });

      it('タイムスタンプをDateに変換する', () => {
        const timestamp = 1705316400000;
        const result = DateSchema.parse(timestamp);
        expect(result).toBeInstanceOf(Date);
      });

      it('DateオブジェクトをそのままDateとして扱う', () => {
        const date = new Date('2024-01-15T10:30:00.000Z');
        const result = DateSchema.parse(date);
        expect(result).toBeInstanceOf(Date);
        expect(result.toISOString()).toBe(date.toISOString());
      });
    });

    describe('PaginationInputSchema', () => {
      it('デフォルト値を適用する', () => {
        const result = PaginationInputSchema.parse({});
        expect(result).toEqual({ page: 1, limit: 20 });
      });

      it('文字列を数値に変換する（coerce）', () => {
        const result = PaginationInputSchema.parse({ page: '3', limit: '50' });
        expect(result).toEqual({ page: 3, limit: 50 });
      });

      it('不正なページ番号を拒否する', () => {
        expect(() => PaginationInputSchema.parse({ page: 0 })).toThrow();
        expect(() => PaginationInputSchema.parse({ page: -1 })).toThrow();
      });

      it('リミット上限を超えた値を拒否する', () => {
        expect(() => PaginationInputSchema.parse({ limit: 101 })).toThrow();
      });
    });

    describe('PaginationOutputSchema', () => {
      it('ページネーション情報を検証する', () => {
        const pagination = {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
        };
        expect(PaginationOutputSchema.parse(pagination)).toEqual(pagination);
      });
    });
  });

  describe('エンティティスキーマ', () => {
    describe('BaseEntitySchema', () => {
      it('基本エンティティフィールドを検証する', () => {
        const entity = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T11:00:00.000Z',
        };
        const result = BaseEntitySchema.parse(entity);
        expect(result.id).toBe(entity.id);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('SampleEntitySchema', () => {
      it('完全なサンプルエンティティを検証する', () => {
        const entity = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T11:00:00.000Z',
          name: 'テスト商品',
          value: 1000,
          status: 'active' as const,
        };
        const result = SampleEntitySchema.parse(entity);
        expect(result.name).toBe('テスト商品');
        expect(result.value).toBe(1000);
        expect(result.status).toBe('active');
      });

      it('不正なステータスを拒否する', () => {
        const entity = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'テスト',
          value: 100,
          status: 'invalid',
        };
        expect(() => SampleEntitySchema.parse(entity)).toThrow();
      });
    });
  });

  describe('入力スキーマ', () => {
    describe('CreateSampleInputSchema', () => {
      it('有効な作成入力を受け入れる', () => {
        const input = {
          name: '新規商品',
          value: 500,
        };
        const result = CreateSampleInputSchema.parse(input);
        expect(result.name).toBe('新規商品');
        expect(result.value).toBe(500);
        expect(result.status).toBe('active'); // デフォルト値
      });

      it('空の名前を拒否する', () => {
        expect(() =>
          CreateSampleInputSchema.parse({
            name: '',
            value: 100,
          })
        ).toThrow(/名前は必須です/);
      });

      it('200文字を超える名前を拒否する', () => {
        expect(() =>
          CreateSampleInputSchema.parse({
            name: 'a'.repeat(201),
            value: 100,
          })
        ).toThrow(/200文字以内/);
      });

      it('負の値を拒否する', () => {
        expect(() =>
          CreateSampleInputSchema.parse({
            name: 'テスト',
            value: -1,
          })
        ).toThrow(/0以上/);
      });
    });

    describe('UpdateSampleInputSchema', () => {
      it('部分更新を許可する', () => {
        const input = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: '更新名',
        };
        const result = UpdateSampleInputSchema.parse(input);
        expect(result.name).toBe('更新名');
        expect(result.value).toBeUndefined();
        expect(result.status).toBeUndefined();
      });

      it('IDのみの更新を許可する', () => {
        const input = {
          id: '550e8400-e29b-41d4-a716-446655440000',
        };
        expect(() => UpdateSampleInputSchema.parse(input)).not.toThrow();
      });
    });

    describe('GetSampleListInputSchema', () => {
      it('フィルタ付きリスト取得入力を受け入れる', () => {
        const input = {
          page: 2,
          limit: 10,
          status: 'active' as const,
        };
        const result = GetSampleListInputSchema.parse(input);
        expect(result).toEqual(input);
      });

      it('フィルタなしでデフォルトページネーションを適用する', () => {
        const result = GetSampleListInputSchema.parse({});
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.status).toBeUndefined();
      });
    });
  });

  describe('出力スキーマ', () => {
    describe('createListOutputSchema', () => {
      it('カスタムアイテムスキーマでリスト出力を生成する', () => {
        const ItemSchema = z.object({
          id: z.string(),
          title: z.string(),
        });
        const ListOutputSchema = createListOutputSchema(ItemSchema);

        const output = {
          items: [
            { id: '1', title: 'Item 1' },
            { id: '2', title: 'Item 2' },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
          },
        };

        const result = ListOutputSchema.parse(output);
        expect(result.items).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
      });
    });

    describe('GetSampleListOutputSchema', () => {
      it('サンプルエンティティのリスト出力を検証する', () => {
        const output = {
          items: [
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              createdAt: new Date(),
              updatedAt: new Date(),
              name: 'サンプル1',
              value: 100,
              status: 'active' as const,
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              createdAt: new Date(),
              updatedAt: new Date(),
              name: 'サンプル2',
              value: 200,
              status: 'inactive' as const,
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
          },
        };

        const result = GetSampleListOutputSchema.parse(output);
        expect(result.items).toHaveLength(2);
        expect(result.items[0].name).toBe('サンプル1');
        expect(result.items[1].status).toBe('inactive');
      });

      it('不正なアイテムを含むリストを拒否する', () => {
        const output = {
          items: [
            {
              id: 'invalid-uuid',
              name: 'サンプル',
              value: 100,
              status: 'active',
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        };

        expect(() => GetSampleListOutputSchema.parse(output)).toThrow();
      });
    });
  });

  describe('実際のユースケースシナリオ', () => {
    it('クエリパラメータからリスト取得入力を生成できる', () => {
      // URLSearchParams をシミュレート
      const queryParams = {
        page: '2',
        limit: '10',
        status: 'active',
      };

      const result = GetSampleListInputSchema.parse(queryParams);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.status).toBe('active');
    });

    it('APIレスポンスからリスト出力をパースできる', () => {
      // JSON.parse をシミュレート
      const jsonResponse = JSON.stringify({
        items: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T11:00:00.000Z',
            name: 'テスト',
            value: 100,
            status: 'active',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const parsed = JSON.parse(jsonResponse);
      const result = GetSampleListOutputSchema.parse(parsed);
      expect(result.items[0].createdAt).toBeInstanceOf(Date);
    });
  });
});
