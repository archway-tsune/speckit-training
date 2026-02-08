/**
 * カタログドメイン — リポジトリ統合テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { productRepository, resetProductStore } from '@/infrastructure/repositories/product';
import { getProducts, getProductById, NotFoundError, type CatalogContext } from '@/domains/catalog/api';
import type { Session } from '@/foundation/auth/session';

describe('productRepository: keyword 検索', () => {
  beforeEach(() => {
    resetProductStore();
  });

  it('findAll が keyword で商品名を部分一致検索できること', async () => {
    const results = await productRepository.findAll({
      keyword: 'Tシャツ',
      offset: 0,
      limit: 100,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.name.includes('Tシャツ') || p.description?.includes('Tシャツ'))).toBe(true);
  });

  it('findAll が keyword で説明文を部分一致検索できること', async () => {
    const results = await productRepository.findAll({
      keyword: 'コットン',
      offset: 0,
      limit: 100,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.description?.includes('コットン'))).toBe(true);
  });

  it('keyword 検索が大文字小文字を区別しないこと', async () => {
    // 英語の商品名・説明文がある場合に大文字小文字を区別しないことを確認
    const lower = await productRepository.findAll({
      keyword: 'e2e',
      offset: 0,
      limit: 100,
    });
    const upper = await productRepository.findAll({
      keyword: 'E2E',
      offset: 0,
      limit: 100,
    });
    expect(lower.length).toBe(upper.length);
    expect(lower.length).toBeGreaterThan(0);
  });

  it('keyword に該当なしの場合空配列を返すこと', async () => {
    const results = await productRepository.findAll({
      keyword: '存在しない商品名XYZ999',
      offset: 0,
      limit: 100,
    });
    expect(results).toEqual([]);
  });

  it('findAll が status と keyword を同時にフィルタできること', async () => {
    const results = await productRepository.findAll({
      status: 'published',
      keyword: 'テスト',
      offset: 0,
      limit: 100,
    });
    expect(results.every((p) => p.status === 'published')).toBe(true);
    expect(
      results.every((p) => p.name.includes('テスト') || p.description?.includes('テスト'))
    ).toBe(true);
  });
});

describe('productRepository: count with filter', () => {
  beforeEach(() => {
    resetProductStore();
  });

  it('count が filter オブジェクト（status + keyword）で正しい件数を返すこと', async () => {
    const allPublished = await productRepository.count({ status: 'published' });
    expect(allPublished).toBeGreaterThan(0);

    const withKeyword = await productRepository.count({
      status: 'published',
      keyword: 'テスト',
    });
    expect(withKeyword).toBeLessThanOrEqual(allPublished);
    expect(withKeyword).toBeGreaterThan(0);
  });

  it('count が filter なしで全件数を返すこと', async () => {
    const total = await productRepository.count();
    expect(total).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// getProducts ユースケース統合テスト
// ─────────────────────────────────────────────────────────────────

describe('getProducts ユースケース統合テスト', () => {
  beforeEach(() => {
    resetProductStore();
  });

  function createBuyerContext(): CatalogContext {
    return {
      session: { userId: 'guest', role: 'buyer' as const, expiresAt: new Date(Date.now() + 3600000) },
      repository: productRepository,
    };
  }

  it('published 商品をページネーション付きで返すこと', async () => {
    const result = await getProducts({ page: 1, limit: 12 }, createBuyerContext());
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products.every((p) => p.status === 'published')).toBe(true);
    expect(result.pagination).toBeDefined();
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(12);
  });

  it('limit=12 指定時に最大12件返すこと', async () => {
    const result = await getProducts({ page: 1, limit: 12 }, createBuyerContext());
    expect(result.products.length).toBeLessThanOrEqual(12);
  });

  it('page=2 で次の12件が返ること', async () => {
    const page1 = await getProducts({ page: 1, limit: 12 }, createBuyerContext());
    const page2 = await getProducts({ page: 2, limit: 12 }, createBuyerContext());

    if (page1.pagination.totalPages >= 2) {
      expect(page2.products.length).toBeGreaterThan(0);
      const page1Ids = page1.products.map((p) => p.id);
      const page2Ids = page2.products.map((p) => p.id);
      expect(page1Ids.some((id) => page2Ids.includes(id))).toBe(false);
    }
  });

  it('未認証でも商品一覧を取得できること（FR-014）', async () => {
    const guestContext: CatalogContext = {
      session: { userId: 'guest', role: 'buyer', expiresAt: new Date() },
      repository: productRepository,
    };
    const result = await getProducts({ page: 1, limit: 12 }, guestContext);
    expect(result.products.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// getProductById ユースケース統合テスト
// ─────────────────────────────────────────────────────────────────

describe('getProductById ユースケース統合テスト', () => {
  beforeEach(() => {
    resetProductStore();
  });

  function createBuyerContext(): CatalogContext {
    return {
      session: { userId: 'guest', role: 'buyer' as const, expiresAt: new Date(Date.now() + 3600000) },
      repository: productRepository,
    };
  }

  it('有効な商品IDで商品詳細（stock含む）が返ること', async () => {
    const result = await getProductById(
      { id: '550e8400-e29b-41d4-a716-446655440000' },
      createBuyerContext()
    );
    expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result).toHaveProperty('stock');
    expect(typeof result.stock).toBe('number');
  });

  it('存在しない商品IDで NotFoundError がスローされること', async () => {
    await expect(
      getProductById(
        { id: '550e8400-e29b-41d4-a716-446655440099' },
        createBuyerContext()
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('draft 商品に buyer ロールでアクセスすると NotFoundError がスローされること', async () => {
    // デニムパンツ (id: ...0005) は draft ステータス
    await expect(
      getProductById(
        { id: '550e8400-e29b-41d4-a716-446655440005' },
        createBuyerContext()
      )
    ).rejects.toThrow(NotFoundError);
  });
});

// ─────────────────────────────────────────────────────────────────
// getProducts キーワード検索統合テスト
// ─────────────────────────────────────────────────────────────────

describe('getProducts キーワード検索統合テスト', () => {
  beforeEach(() => {
    resetProductStore();
  });

  function createBuyerContext(): CatalogContext {
    return {
      session: { userId: 'guest', role: 'buyer' as const, expiresAt: new Date(Date.now() + 3600000) },
      repository: productRepository,
    };
  }

  it('keyword 指定で商品名に一致する商品のみ返ること', async () => {
    const result = await getProducts({ page: 1, limit: 12, keyword: 'Tシャツ' }, createBuyerContext());
    expect(result.products.length).toBeGreaterThan(0);
    expect(
      result.products.every((p) => p.name.includes('Tシャツ') || p.description?.includes('Tシャツ'))
    ).toBe(true);
  });

  it('keyword 指定で説明文に一致する商品のみ返ること', async () => {
    const result = await getProducts({ page: 1, limit: 12, keyword: 'コットン' }, createBuyerContext());
    expect(result.products.length).toBeGreaterThan(0);
    expect(
      result.products.every((p) => p.name.includes('コットン') || p.description?.includes('コットン'))
    ).toBe(true);
  });

  it('keyword に該当なしで空配列と pagination.total=0 を返すこと', async () => {
    const result = await getProducts(
      { page: 1, limit: 12, keyword: '存在しない商品名XYZ999' },
      createBuyerContext()
    );
    expect(result.products).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it('keyword と pagination が同時に動作すること', async () => {
    const result = await getProducts(
      { page: 1, limit: 2, keyword: 'Tシャツ' },
      createBuyerContext()
    );
    expect(result.products.length).toBeLessThanOrEqual(2);
    expect(result.pagination.limit).toBe(2);
  });
});
