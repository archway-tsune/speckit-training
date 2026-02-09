import { describe, it, expect } from 'vitest';
import { formatPrice, formatDateTime } from '@/templates/ui/utils/format';

// ─────────────────────────────────────────────────────────────────
// formatPrice
// ─────────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  describe('正常系', () => {
    it('Given 正の整数, When formatPrice(1000), Then "¥1,000" を返す', () => {
      expect(formatPrice(1000)).toBe('¥1,000');
    });

    it('Given 大きな数, When formatPrice(1000000), Then "¥1,000,000" を返す', () => {
      expect(formatPrice(1000000)).toBe('¥1,000,000');
    });

    it('Given 小さい正の数, When formatPrice(100), Then "¥100" を返す', () => {
      expect(formatPrice(100)).toBe('¥100');
    });

    it('Given 15800, When formatPrice(15800), Then "¥15,800" を返す', () => {
      expect(formatPrice(15800)).toBe('¥15,800');
    });
  });

  describe('0円の場合', () => {
    it('Given 0, When formatPrice(0), Then "無料" を返す', () => {
      expect(formatPrice(0)).toBe('無料');
    });
  });

  describe('負の数の場合', () => {
    it('Given 負の数, When formatPrice(-500), Then "-¥500" を返す', () => {
      expect(formatPrice(-500)).toBe('-¥500');
    });

    it('Given 大きな負の数, When formatPrice(-1500), Then "-¥1,500" を返す', () => {
      expect(formatPrice(-1500)).toBe('-¥1,500');
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// formatDateTime
// ─────────────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  describe('正常系（ISO文字列）', () => {
    it('Given 有効なISO文字列, When formatDateTime, Then 日本語フォーマットを返す', () => {
      const result = formatDateTime('2026-02-07T14:30:00');
      expect(result).toContain('2026');
      expect(result).toContain('2');
      expect(result).toContain('7');
      expect(result).toContain('14');
      expect(result).toContain('30');
    });
  });

  describe('正常系（Dateオブジェクト）', () => {
    it('Given Dateオブジェクト, When formatDateTime, Then 日本語フォーマットを返す', () => {
      const date = new Date(2026, 0, 1, 10, 0);
      const result = formatDateTime(date);
      expect(result).toContain('2026');
      expect(result).toContain('1');
      expect(result).toContain('1');
    });
  });

  describe('異常系', () => {
    it('Given 無効な日時文字列, When formatDateTime, Then "-" を返す', () => {
      expect(formatDateTime('invalid-date')).toBe('-');
    });

    it('Given 空文字列, When formatDateTime, Then "-" を返す', () => {
      expect(formatDateTime('')).toBe('-');
    });
  });
});
