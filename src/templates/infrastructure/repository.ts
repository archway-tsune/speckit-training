/**
 * インメモリリポジトリテンプレート
 *
 * 使用例:
 * - デモ・開発・テスト用のデータストア
 * - プロトタイプの迅速な開発
 *
 * カスタマイズポイント:
 * - Entity: エンティティ型
 * - initialData: 初期データ
 * - Repository: リポジトリインターフェース
 *
 * 本番環境では、このテンプレートを参考にして
 * データベースを使用したリポジトリに置き換えてください。
 *
 * 注意: 開発環境でのHMR（Hot Module Replacement）対策
 * Next.js開発環境ではHMRによりモジュールが再読み込みされ、
 * インメモリストアがリセットされます。これを防ぐには
 * globalThisパターンを使用してください。
 * 詳細は createHmrSafeStore() を参照。
 */

// ─────────────────────────────────────────────────────────────────
// 汎用型定義
// ─────────────────────────────────────────────────────────────────

/** 基本エンティティインターフェース */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** ページネーションパラメータ */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/** フィルタ可能なパラメータ */
export interface FilterParams<T> extends PaginationParams {
  filter?: Partial<T>;
}

// ─────────────────────────────────────────────────────────────────
// HMR対策用ストアファクトリ
// ─────────────────────────────────────────────────────────────────

/**
 * HMR（Hot Module Replacement）に対応したストアを生成
 *
 * Next.js開発環境ではHMRによりモジュールが再読み込みされ、
 * 通常のMapはリセットされてしまいます。globalThisを使用することで
 * HMR後もデータを維持できます。
 *
 * @param globalKey グローバル変数のキー名（一意である必要があります）
 * @param initialData 初期データ
 * @returns HMR対応のストア
 *
 * @example
 * ```typescript
 * // 商品ストア（HMR対応）
 * const productStore = createHmrSafeStore<Product>('__productStore', sampleProducts);
 *
 * // カートストア（HMR対応、ユーザーIDベース）
 * const cartStore = createHmrSafeUserStore<Cart>('__cartStore');
 * ```
 */
export function createHmrSafeStore<T extends BaseEntity>(
  globalKey: string,
  initialData: T[] = []
): Map<string, T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalAny = globalThis as any;

  if (!globalAny[globalKey]) {
    globalAny[globalKey] = new Map<string, T>(initialData.map((item) => [item.id, item]));
  }

  return globalAny[globalKey];
}

/**
 * HMR対応のユーザーIDベースストアを生成
 *
 * @param globalKey グローバル変数のキー名
 * @returns HMR対応のユーザーIDベースストア
 */
export function createHmrSafeUserStore<T>(globalKey: string): Map<string, T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalAny = globalThis as any;

  if (!globalAny[globalKey]) {
    globalAny[globalKey] = new Map<string, T>();
  }

  return globalAny[globalKey];
}

// ─────────────────────────────────────────────────────────────────
// インメモリストアファクトリ
// ─────────────────────────────────────────────────────────────────

/**
 * インメモリストアを生成
 *
 * 注意: 開発環境でHMRによるデータリセットを防ぎたい場合は
 * createHmrSafeStore() を使用してください。
 *
 * @param initialData 初期データ
 * @returns ストア操作関数
 */
export function createInMemoryStore<T extends BaseEntity>(initialData: T[] = []) {
  const store = new Map<string, T>(initialData.map((item) => [item.id, item]));

  return {
    /**
     * すべてのエンティティを取得
     */
    getAll(): T[] {
      return Array.from(store.values());
    },

    /**
     * IDでエンティティを取得
     */
    getById(id: string): T | null {
      return store.get(id) || null;
    },

    /**
     * エンティティを保存
     */
    set(entity: T): void {
      store.set(entity.id, entity);
    },

    /**
     * エンティティを削除
     */
    delete(id: string): boolean {
      return store.delete(id);
    },

    /**
     * ストアをクリア
     */
    clear(): void {
      store.clear();
    },

    /**
     * ストアをリセット（初期データに戻す）
     */
    reset(): void {
      store.clear();
      initialData.forEach((item) => store.set(item.id, item));
    },

    /**
     * エンティティ数を取得
     */
    count(): number {
      return store.size;
    },

    /**
     * 条件に一致するエンティティを検索
     */
    filter(predicate: (entity: T) => boolean): T[] {
      return Array.from(store.values()).filter(predicate);
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// ユーザーIDベースのストアファクトリ
// ─────────────────────────────────────────────────────────────────

/**
 * ユーザーIDをキーとするインメモリストアを生成
 * カートや注文など、ユーザーごとのデータ管理に使用
 *
 * 注意: 開発環境でHMRによるデータリセットを防ぎたい場合は
 * createHmrSafeUserStore() を使用してください。
 */
export function createUserBasedStore<T>() {
  const store = new Map<string, T>();

  return {
    /**
     * ユーザーIDでデータを取得
     */
    get(userId: string): T | null {
      return store.get(userId) || null;
    },

    /**
     * ユーザーIDでデータを保存
     */
    set(userId: string, data: T): void {
      store.set(userId, data);
    },

    /**
     * ユーザーIDでデータを削除
     */
    delete(userId: string): boolean {
      return store.delete(userId);
    },

    /**
     * ストアをクリア
     */
    clear(): void {
      store.clear();
    },

    /**
     * すべてのユーザーIDを取得
     */
    keys(): string[] {
      return Array.from(store.keys());
    },

    /**
     * すべてのデータを取得
     */
    values(): T[] {
      return Array.from(store.values());
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// UUID生成ユーティリティ
// ─────────────────────────────────────────────────────────────────

/**
 * UUID v4を生成
 */
export function generateId(): string {
  return crypto.randomUUID();
}

// ─────────────────────────────────────────────────────────────────
// リポジトリテンプレート例
// ─────────────────────────────────────────────────────────────────

/**
 * CRUDリポジトリの基本実装を生成
 *
 * @example
 * ```typescript
 * interface Product extends BaseEntity {
 *   name: string;
 *   price: number;
 *   status: 'draft' | 'published';
 * }
 *
 * const productStore = createInMemoryStore<Product>([
 *   { id: '1', name: 'Product 1', price: 1000, status: 'published', createdAt: new Date(), updatedAt: new Date() },
 * ]);
 *
 * const productRepository = createCrudRepository<Product, ProductCreateInput, ProductUpdateInput>(
 *   productStore,
 *   (input) => ({
 *     id: generateId(),
 *     ...input,
 *     createdAt: new Date(),
 *     updatedAt: new Date(),
 *   }),
 *   (entity, input) => ({
 *     ...entity,
 *     ...input,
 *     updatedAt: new Date(),
 *   })
 * );
 * ```
 */
export function createCrudRepository<
  T extends BaseEntity,
  CreateInput,
  UpdateInput,
>(
  store: ReturnType<typeof createInMemoryStore<T>>,
  createEntity: (input: CreateInput) => T,
  updateEntity: (entity: T, input: UpdateInput) => T
) {
  return {
    async findAll(params: FilterParams<T>): Promise<T[]> {
      let items = store.getAll();

      // フィルタ適用
      if (params.filter) {
        items = items.filter((item) =>
          Object.entries(params.filter!).every(
            ([key, value]) => value === undefined || item[key as keyof T] === value
          )
        );
      }

      // 日付降順ソート
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // ページネーション
      return items.slice(params.offset, params.offset + params.limit);
    },

    async findById(id: string): Promise<T | null> {
      return store.getById(id);
    },

    async create(input: CreateInput): Promise<T> {
      const entity = createEntity(input);
      store.set(entity);
      return entity;
    },

    async update(id: string, input: UpdateInput): Promise<T> {
      const existing = store.getById(id);
      if (!existing) {
        throw new Error(`Entity with id ${id} not found`);
      }

      const updated = updateEntity(existing, input);
      store.set(updated);
      return updated;
    },

    async delete(id: string): Promise<void> {
      store.delete(id);
    },

    async count(filter?: Partial<T>): Promise<number> {
      if (!filter) {
        return store.count();
      }

      return store.filter((item) =>
        Object.entries(filter).every(
          ([key, value]) => value === undefined || item[key as keyof T] === value
        )
      ).length;
    },
  };
}

export default createInMemoryStore;
