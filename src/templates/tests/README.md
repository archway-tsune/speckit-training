# テストテンプレート

ECサイト向けアーキテクチャ基盤のテストテンプレート集。

## 構成

```
src/templates/tests/
├── unit/
│   ├── usecase.test.ts     # BE単体テスト（ユースケース）
│   └── component.test.tsx  # FE単体テスト（コンポーネント）
├── integration/
│   └── api.test.ts         # API統合テスト
├── e2e/
│   ├── buyer-flow.spec.ts  # 購入者導線E2E
│   └── admin-flow.spec.ts  # 管理者導線E2E
└── README.md               # 本ファイル
```

## TDD サイクル

すべてのテストは TDD（テスト駆動開発）のサイクルに従います：

```
RED → GREEN → REFACTOR
 │       │        │
 │       │        └─ コードを改善（テストは通ったまま）
 │       └─ 最小限の実装でテストを通す
 └─ まず失敗するテストを書く
```

## テスト形式

すべてのテストは **Given-When-Then** 形式で記述します：

```typescript
it('Given 条件, When 操作, Then 結果', () => {
  // Arrange - テストデータとモックを準備（Given）
  const input = { ... };

  // Act - 操作を実行（When）
  const result = await someFunction(input);

  // Assert - 結果を検証（Then）
  expect(result).toEqual(expected);
});
```

## 単体テスト（BE）

### 使い方

1. `src/templates/tests/unit/usecase.test.ts` をコピー
2. 実際のユースケースに合わせて修正
3. テスト対象のモジュールをインポート

### テスト観点

- **正常系**: 期待される動作の確認
- **異常系**: エラーハンドリングの確認
- **認可条件**: ロールベースのアクセス制御の確認

### 例

```typescript
describe('getProducts ユースケース', () => {
  describe('正常系', () => {
    it('Given 商品が存在する, When 商品一覧を取得, Then 商品リストが返される', async () => {
      // Arrange
      const mockRepository = createMockRepository([product1, product2]);

      // Act
      const result = await getProducts({ repository: mockRepository });

      // Assert
      expect(result.products).toHaveLength(2);
    });
  });

  describe('認可条件', () => {
    it('Given buyerロール, When 商品一覧を取得, Then 成功する', async () => {
      // ...
    });

    it('Given 未認証, When 商品一覧を取得, Then UNAUTHORIZED', async () => {
      // ...
    });
  });
});
```

## 単体テスト（FE）

### 使い方

1. `src/templates/tests/unit/component.test.tsx` をコピー
2. 実際のコンポーネントに合わせて修正
3. Testing Library を使用

### テスト観点

- **loading状態**: ローディング中の表示
- **error状態**: エラー発生時の表示
- **empty状態**: データがない場合の表示
- **data状態**: 正常なデータ表示
- **インタラクション**: ユーザー操作の確認
- **アクセシビリティ**: ARIA属性の確認

### 例

```typescript
describe('ProductList コンポーネント', () => {
  it('Given ローディング中, When レンダリング, Then ローディング表示', () => {
    render(<ProductList loading={true} products={[]} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
  });

  it('Given 商品が空, When レンダリング, Then 空状態表示', () => {
    render(<ProductList loading={false} products={[]} />);
    expect(screen.getByText('商品がありません')).toBeInTheDocument();
  });
});
```

### インタラクティブコンポーネントのテスト例

```typescript
// --- ボタン操作テスト（QuantitySelector パターン） ---
describe('QuantitySelector', () => {
  it('Given value=3, When +ボタンを押す, Then onChange(4) が呼ばれる', async () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={3} min={1} max={10} onChange={onChange} />);
    await user.click(screen.getByTestId('quantity-increment'));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});

// --- キーボード操作テスト（SearchBar パターン） ---
describe('SearchBar', () => {
  it('Given テキスト入力済み, When Enterキーを押す, Then onSearchが呼ばれる', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await user.type(screen.getByTestId('search-input'), 'テスト{Enter}');
    expect(onSearch).toHaveBeenCalledWith('テスト');
  });
});

// --- 条件付き表示テスト（Pagination パターン） ---
describe('Pagination', () => {
  it('Given total=0, When レンダリング, Then 非表示', () => {
    const { container } = render(
      <Pagination page={1} limit={10} total={0} totalPages={0} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});

// --- サイズバリアントテスト（ImagePlaceholder パターン） ---
describe('ImagePlaceholder', () => {
  it('Given size="sm", When レンダリング, Then 小サイズ', () => {
    render(<ImagePlaceholder alt="テスト" size="sm" />);
    expect(screen.getByTestId('image-placeholder').className).toContain('w-16');
  });
});
```

## API統合テスト

### 使い方

1. `src/templates/tests/integration/api.test.ts` をコピー
2. 実際のAPIハンドラに合わせて修正
3. 入出力スキーマを検証

### テスト観点

- **契約検証**: 入出力スキーマの整合性
- **認可条件**: ロールベースのアクセス制御
- **エラーコード**: 適切なエラーレスポンス
- **状態変更**: データの永続化確認

### 例

```typescript
describe('POST /api/products', () => {
  it('レスポンスが出力スキーマに準拠している', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Cookie', sessionCookie(adminSession))
      .send({ name: 'テスト', price: 1000 });

    expect(response.status).toBe(200);
    expect(ProductSchema.safeParse(response.body).success).toBe(true);
  });

  it('未認証ユーザーは401エラー', async () => {
    const response = await request(app).post('/api/products');
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });
});
```

## E2Eテスト

### 使い方

1. `src/templates/tests/e2e/*.spec.ts` をコピー
2. 実際の導線に合わせて修正
3. Playwright を使用

### テスト観点

- **購入者導線**: 商品閲覧 → カート → 注文
- **管理者導線**: 商品管理 → 注文管理
- **認証フロー**: ログイン → 操作 → ログアウト

### data-testid 規約

| 要素 | data-testid | 例 |
|------|-------------|-----|
| 入力フィールド | `{name}-input` | `search-input`, `email-input` |
| ボタン | `{action}-button` | `login-button`, `save-product-button` |
| リスト | `{name}-list` | `product-list`, `order-list` |
| カード | `{name}-card` | `product-card` |
| 行 | `{name}-row` | `product-row`, `order-row` |
| メッセージ | `{type}-message` | `success-message`, `error-message` |
| バッジ | `{name}-badge` | `status-badge` |
| ページネーション前へ | `pagination-prev` | — |
| ページネーション次へ | `pagination-next` | — |
| ページネーション情報 | `pagination-info` | — |
| 検索入力 | `search-input` | — |
| 検索クリア | `search-clear` | — |
| 数量増加 | `quantity-increment` | — |
| 数量減少 | `quantity-decrement` | — |
| 数量表示 | `quantity-value` | — |
| 画像プレースホルダー | `image-placeholder` | — |
| ローディングスピナー | `loading-spinner` | — |

### 例

```typescript
test('商品閲覧からカート追加まで', async ({ page }) => {
  // Given: buyerロールでログイン
  await login(page, 'buyer');

  // When: 商品一覧→詳細→カート追加
  await page.goto('/catalog');
  await page.click('[data-testid="product-card"]:first-child');
  await page.click('[data-testid="add-to-cart-button"]');

  // Then: カート件数が更新される
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
});

// --- SearchBar 操作パターン ---
test('キーワードで商品を検索', async ({ page }) => {
  await page.goto('/catalog');
  await page.fill('[data-testid="search-input"]', 'テスト商品');
  await page.press('[data-testid="search-input"]', 'Enter');
  await expect(page.locator('[data-testid="product-list"]')).toBeVisible();
});

// --- Pagination 操作パターン ---
test('ページネーションで次ページへ遷移', async ({ page }) => {
  await page.goto('/catalog');
  await expect(page.locator('[data-testid="pagination-info"]')).toContainText('件を表示');
  await page.click('[data-testid="pagination-next"]');
  await expect(page.locator('[data-testid="pagination-info"]')).toContainText('件を表示');
});

// --- QuantitySelector 操作パターン ---
test('数量を+ボタンで変更', async ({ page }) => {
  await page.goto('/cart');
  await page.click('[data-testid="quantity-increment"]');
  await expect(page.locator('[data-testid="quantity-value"]')).toBeVisible();
});
```

## 品質基準

| 項目 | 基準 |
|------|------|
| カバレッジ | 80% 以上 |
| 単体テスト | 正常系・異常系・認可条件を網羅 |
| 統合テスト | 契約・認可・エラーコードを検証 |
| E2Eテスト | 主要導線をカバー |

## 実行コマンド

```bash
# 単体テスト
pnpm test:unit

# 統合テスト
pnpm test:integration

# E2Eテスト（ドメイン実装のみ）
pnpm test:e2e

# E2Eテスト（アーキテクチャ基盤の検証用）
pnpm test:e2e:arch

# カバレッジ確認
pnpm test:coverage
```

### E2Eテストのディレクトリ構成

```
tests/e2e/
├── arch/                    # アーキテクチャ基盤のE2E（pnpm test:e2e では除外）
│   ├── buyer-flow.spec.ts   # 購入者導線
│   └── admin-flow.spec.ts   # 管理者導線
├── my-feature.spec.ts       # ← ドメインのE2Eテストはここに配置
└── ...
```

- `pnpm test:e2e` — `tests/e2e/` 直下のテストのみ実行（`arch/` は除外）
- `pnpm test:e2e:arch` — `tests/e2e/arch/` のテストのみ実行
