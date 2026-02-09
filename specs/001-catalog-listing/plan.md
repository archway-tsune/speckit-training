# 実装計画: カタログ閲覧機能

**ブランチ**: `001-catalog-listing` | **日付**: 2026-02-09 | **仕様書**: [spec.md](./spec.md)
**入力**: `specs/001-catalog-listing/spec.md` の機能仕様書

## サマリー

購入者が認証不要で商品カタログを閲覧できる機能を実装する。`src/domains/catalog/` のスタブ（NotImplementedError / プレースホルダー）を本番実装に置き換え、商品一覧表示（12件/ページ、ページネーション）、商品詳細表示（在庫状況・カート追加ボタン制御）、キーワード検索の3機能を提供する。`src/contracts/catalog.ts` に `stock` フィールドと `keyword` 検索パラメータを追加し、既存のインメモリリポジトリとサンプルコードを同期更新する。テスト駆動開発（Red → Green → Refactor）を徹底する。

## 技術コンテキスト

**言語/バージョン**: TypeScript 5 (strict mode)
**プライマリ依存**: Next.js 14 (App Router), React 18, Tailwind CSS 3, Zod
**ストレージ**: インメモリリポジトリ（`globalThis` HMR キャッシュ）
**テスト**: Vitest 1.6（単体・統合）、Playwright 1.45（E2E）、React Testing Library 16
**ターゲットプラットフォーム**: Web ブラウザ（デスクトップ・モバイル）
**プロジェクトタイプ**: Web アプリケーション（Next.js App Router）
**パフォーマンス目標**: 一覧ページ初回ロード 3秒以内
**制約**: 認証不要、カート機能自体はスコープ外（ボタン表示のみ）
**スケール/スコープ**: サンプル商品6件、ページネーション12件/ページ

## 憲章チェック

*ゲート: フェーズ0リサーチ前に通過必須。フェーズ1設計後に再チェック。*

| 原則 | 適合 | 備考 |
|------|------|------|
| I. テンプレート駆動開発 | ✅ | `src/templates/` のコンポーネント（Loading, Error, Empty, SearchBar, Pagination）を活用。`@/foundation/validation/runtime` と `@/foundation/errors/response` を使用 |
| II. ドメイン分離 | ✅ | `src/domains/catalog/` に api/ と ui/ を独立実装。`src/contracts/catalog.ts` に準拠。ドメイン間の直接 import なし |
| III. テストファースト | ✅ | TDD（Red → Green → Refactor）を徹底。各ユースケースにテストタスクを含む。カバレッジ80%以上目標 |
| IV. 実装ワークフロー | ✅ | スタブ置換パターンに従う。navLinks は `商品一覧` のみ有効化（カート・注文履歴はスコープ外）。spec.md 外の機能は実装しない |
| スコープ外除外 | ✅ | カート機能自体の実装、カテゴリフィルタ、ソートは実装しない。admin 向け商品管理は既存のまま（スタブ維持） |
| 日本語記述 | ✅ | すべてのドキュメント・テスト記述を日本語で行う |

## プロジェクト構造

### ドキュメント（本機能）

```text
specs/001-catalog-listing/
├── plan.md              # 本ファイル
├── research.md          # フェーズ0 調査結果
├── data-model.md        # フェーズ1 データモデル
├── quickstart.md        # フェーズ1 クイックスタート
├── contracts/           # フェーズ1 API コントラクト
│   └── catalog-api.md
└── tasks.md             # フェーズ2 タスク一覧（/speckit.tasks で生成）
```

### ソースコード（リポジトリルート）

```text
src/
├── contracts/
│   └── catalog.ts              # 変更: stock フィールド追加、keyword パラメータ追加
├── domains/
│   └── catalog/
│       ├── api/
│       │   └── index.ts        # 変更: スタブ → 本番ユースケース実装
│       └── ui/
│           ├── index.tsx        # 変更: スタブ → 本番コンポーネントエクスポート
│           ├── ProductCard.tsx  # 新規: 商品カード（在庫表示対応）
│           ├── ProductList.tsx  # 新規: 商品一覧（検索・ページネーション統合）
│           └── ProductDetail.tsx # 新規: 商品詳細（在庫数・ボタン制御）
├── infrastructure/
│   └── repositories/
│       └── product.ts          # 変更: stock データ追加、keyword 検索対応
├── samples/
│   └── domains/
│       └── catalog/
│           ├── api/
│           │   └── usecases.ts # 変更: stock・keyword 対応
│           └── ui/
│               ├── ProductCard.tsx  # 変更: stock 対応
│               ├── ProductList.tsx  # 変更不要（汎用的な設計）
│               └── ProductDetail.tsx # 変更: stock 対応
├── app/
│   ├── (buyer)/
│   │   ├── layout.tsx          # 変更: navLinks の商品一覧リンクを有効化
│   │   └── catalog/
│   │       ├── page.tsx        # 変更: データフェッチ・検索・ページネーション統合
│   │       └── [id]/
│   │           └── page.tsx    # 変更: データフェッチ・在庫表示統合
│   └── api/
│       └── catalog/
│           └── products/
│               ├── route.ts    # 変更: keyword クエリパラメータ対応
│               └── [id]/
│                   └── route.ts # 変更不要（既存で動作）

tests/
├── unit/
│   └── domains/
│       └── catalog/
│           ├── usecase.test.ts   # 新規: 本番ユースケーステスト
│           └── ui.test.tsx       # 新規: 本番 UI コンポーネントテスト
├── integration/
│   └── domains/
│       └── catalog/
│           └── api.test.ts       # 新規: API 統合テスト（契約検証）
└── e2e/
    └── catalog/
        └── buyer-flow.spec.ts    # 新規: 購入者導線 E2E テスト
```

**構造決定**: 既存のドメイン分離構造に従い、`src/domains/catalog/` のスタブを置換。テストは `tests/` 直下に本番テストとして配置（サンプルテストとは分離）。

## 実装フェーズ

### フェーズ 1: 契約・基盤変更（前提作業）

**目的**: 他のすべてのフェーズが依存する契約とデータ基盤を整備する。

1. **契約スキーマ変更** (`src/contracts/catalog.ts`)
   - `ProductSchema` に `stock: z.number().int().min(0)` を追加
   - `GetProductsInputSchema` に `keyword: z.string().optional()` を追加
   - `CreateProductInputSchema` に `stock: z.number().int().min(0, '在庫数は0以上で入力してください')` を追加
   - `UpdateProductInputSchema` に `stock: z.number().int().min(0).optional()` を追加
   - `ProductRepository` インターフェースの `findAll` パラメータに `keyword?: string` を追加
   - `count` メソッドのシグネチャに `keyword?: string` を追加

2. **リポジトリ更新** (`src/infrastructure/repositories/product.ts`)
   - サンプルデータに `stock` フィールドを追加（1件は stock: 0 で在庫切れテスト用）
   - 画像URLを Unsplash の高品質画像に変更
   - `findAll` に `keyword` フィルタリング処理を追加（`name` と `description` の部分一致検索）
   - `count` に `keyword` フィルタリング処理を追加

3. **サンプルコード同期** (`src/samples/`)
   - `src/samples/domains/catalog/api/usecases.ts` の `getProducts` に `keyword` パラメータ転送を追加
   - `src/samples/domains/catalog/ui/` の型エラー修正（`stock` フィールド追加に伴う変更がある場合）

### フェーズ 2: ユーザーストーリー 1 — 商品一覧の閲覧（P1）

**目的**: 最も基本的な機能である商品一覧表示を実装する。

**TDD サイクル（各タスクで Red → Green → Refactor）**:

1. **ユースケーステスト・実装** (`tests/unit/domains/catalog/usecase.test.ts`)
   - テスト: `getProducts` — 購入者として published 商品一覧をページネーション付きで取得
   - テスト: `getProducts` — 在庫0商品が一覧に含まれる（除外されない）
   - テスト: `getProducts` — 空結果の場合に空配列とページネーション情報を返す
   - 実装: `src/domains/catalog/api/index.ts` の `getProducts` をスタブから本番に置換

2. **UI コンポーネントテスト・実装**
   - テスト・実装: `ProductCard` — 商品画像・商品名・価格・在庫状況を表示。stock === 0 の場合「在庫切れ」バッジ表示。画像未設定時はプレースホルダー
   - テスト・実装: `ProductList` — 商品カードのグリッド表示、ローディング/エラー/空状態、ページネーション
   - ファイル: `src/domains/catalog/ui/ProductCard.tsx`, `ProductList.tsx`, `index.tsx`

3. **統合テスト** (`tests/integration/domains/catalog/api.test.ts`)
   - テスト: `getProducts` の入出力が契約スキーマに準拠
   - テスト: ページネーション計算の正確性

4. **本番ページ統合** (`src/app/(buyer)/catalog/page.tsx`)
   - データフェッチ（`/api/catalog/products?page=N&limit=12`）
   - ページネーション状態管理
   - ローディング/エラー/空状態の処理

5. **ナビゲーション有効化** (`src/app/(buyer)/layout.tsx`)
   - navLinks の `{ href: '/catalog', label: '商品一覧' }` コメント解除
   - スコープ外リンク（カート・注文履歴）はコメントアウトのまま

### フェーズ 3: ユーザーストーリー 2 — 商品詳細の確認（P2）

**目的**: 商品詳細画面で在庫情報を含む詳細情報を表示する。

**TDD サイクル**:

1. **ユースケーステスト・実装** (`tests/unit/domains/catalog/usecase.test.ts`)
   - テスト: `getProductById` — 存在する商品の詳細を返す
   - テスト: `getProductById` — 存在しない商品 ID で NotFoundError
   - テスト: `getProductById` — 未公開商品を購入者が閲覧すると NotFoundError
   - 実装: `src/domains/catalog/api/index.ts` の `getProductById` をスタブから本番に置換

2. **UI コンポーネントテスト・実装**
   - テスト・実装: `ProductDetail` — 商品画像・商品名・価格・説明文・在庫数を表示。在庫0でカートボタン無効化。画像未設定時プレースホルダー
   - ファイル: `src/domains/catalog/ui/ProductDetail.tsx`

3. **統合テスト** (`tests/integration/domains/catalog/api.test.ts`)
   - テスト: `getProductById` の出力が契約スキーマに準拠
   - テスト: 一覧取得 → 詳細取得のエンドツーエンドフロー

4. **本番ページ統合** (`src/app/(buyer)/catalog/[id]/page.tsx`)
   - データフェッチ（`/api/catalog/products/:id`）
   - 在庫表示・カートボタン制御
   - 一覧ページへの戻るリンク

### フェーズ 4: ユーザーストーリー 3 — 商品検索（P3）

**目的**: キーワードによる商品検索機能を追加する。

**TDD サイクル**:

1. **ユースケーステスト・実装** (`tests/unit/domains/catalog/usecase.test.ts`)
   - テスト: `getProducts` — keyword パラメータで商品名を部分一致検索
   - テスト: `getProducts` — keyword パラメータで説明文を部分一致検索
   - テスト: `getProducts` — 該当なしの場合に空配列を返す
   - テスト: `getProducts` — keyword が空文字の場合は全件返す
   - 実装: ユースケースの keyword 転送確認（リポジトリ側は既にフェーズ1で対応済み）

2. **UI コンポーネントテスト・実装**
   - テスト・実装: `ProductList` に `SearchBar` テンプレートコンポーネントを統合
   - テスト: 検索実行で onSearch コールバック発火
   - テスト: クリアで全商品表示に戻る

3. **統合テスト** (`tests/integration/domains/catalog/api.test.ts`)
   - テスト: keyword 付きリクエストの入出力が契約スキーマに準拠
   - テスト: 検索 → 詳細取得のフロー

4. **本番ページ統合** (`src/app/(buyer)/catalog/page.tsx`)
   - 検索バーの状態管理
   - 検索時にページ番号を1にリセット
   - 検索結果のページネーション

### フェーズ 5: E2E テスト・最終検証

**目的**: 購入者導線の E2E テストで全体の動作を検証する。

1. **E2E テスト作成** (`tests/e2e/catalog/buyer-flow.spec.ts`)
   - テスト: 商品一覧ページが正しく表示される
   - テスト: 商品カードに画像・名前・価格・在庫状況が表示される
   - テスト: 在庫切れ商品に「在庫切れ」バッジが表示される
   - テスト: ページネーションで次ページに遷移できる
   - テスト: 商品カードクリックで詳細ページに遷移
   - テスト: 詳細ページに画像・名前・価格・説明文・在庫数が表示される
   - テスト: 在庫切れ商品でカート追加ボタンが無効化される
   - テスト: 検索キーワードで商品がフィルタリングされる
   - テスト: 検索クリアで全商品表示に戻る
   - テスト: 商品0件時に「商品がありません」メッセージ表示
   - テスト: ナビゲーションの「商品一覧」リンクが機能する

2. **品質チェック**
   - TypeScript strict エラー 0件
   - ESLint エラー 0件
   - テストカバレッジ 80%以上
   - 全テスト通過確認

## 複雑性トラッキング

憲章チェックに違反なし。追加の複雑性は不要。

| 変更 | 理由 | より単純な代替案を却下した理由 |
|------|------|-------------------------------|
| `stock` フィールド追加 | 仕様で在庫数表示・在庫切れ判定が必須 | `status` ベースでは在庫数の表示要件を満たせない |
| `keyword` パラメータ追加 | 仕様でキーワード検索が必須 | クライアント側フィルタリングはデータ量増大時にスケールしない |
