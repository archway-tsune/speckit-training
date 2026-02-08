# 実装計画: 商品カタログ閲覧

**ブランチ**: `001-catalog-listing` | **日付**: 2026-02-08 | **仕様**: [spec.md](./spec.md)
**入力**: `specs/001-catalog-listing/spec.md` の機能仕様書

## サマリー

購入者が認証不要で商品カタログを閲覧できる機能を実装する。商品一覧表示（カード形式、12件/ページ、ページネーション）、商品詳細表示（在庫数・カート追加ボタン付き）、キーワード検索の3つのユーザーストーリーを、テスト駆動開発（TDD）で段階的に実装する。

既存の `src/samples/domains/catalog/` を参考に `src/domains/catalog/` を本番実装に置き換える。コントラクトに `stock`（在庫数）フィールドと `keyword`（検索キーワード）パラメータを追加する。商品画像には Unsplash の高品質な画像URLを使用する。

## 技術コンテキスト

**言語/バージョン**: TypeScript 5 (strict mode)
**主要依存関係**: Next.js 14 (App Router), React 18, Tailwind CSS 3, Zod
**ストレージ**: インメモリリポジトリ（globalThis HMR対応）
**テスト**: Vitest 1.6（単体・統合）、Playwright 1.45（E2E）、React Testing Library 16
**対象プラットフォーム**: Webブラウザ（デスクトップ・モバイル対応）
**プロジェクト種別**: Webアプリケーション（Next.js App Router）
**パフォーマンス目標**: 一覧ページ初回ロード2秒以内、検索結果1秒以内
**制約**: 認証不要で閲覧可能、カート機能自体はスコープ外
**規模**: 購入者向けカタログ機能（一覧・詳細・検索の3画面）

## 憲法チェック

*ゲート: フェーズ0リサーチ前に合格必須。フェーズ1設計後に再チェック。*

| 原則 | ステータス | 根拠 |
|------|----------|------|
| I. テンプレート駆動開発 | ✅ 合格 | `src/templates/` のコンポーネント（SearchBar, Pagination, Empty, Loading, Error, ImagePlaceholder）とページテンプレート（ListPage, DetailPage）を活用。`src/foundation/` の validation/runtime と errors/response を使用 |
| II. ドメイン分離 | ✅ 合格 | `src/domains/catalog/` に types/api/ui を分離して実装。`src/contracts/catalog.ts` に準拠し、`src/samples/` を参考に実装 |
| III. テストファースト | ✅ 合格 | TDD（Red → Green → Refactor）を全ステップで厳守。Red フェーズの確認をスキップしない。カバレッジ80%以上を目標 |
| IV. 実装ワークフロー | ✅ 合格 | `src/domains/catalog/` のスキャフォールドを本番実装に置換。ユーザーストーリー単位で段階的に実装。購入者レイアウトの navLinks に商品一覧リンクを追加 |

## プロジェクト構造

### ドキュメント（本フィーチャー）

```text
specs/001-catalog-listing/
├── spec.md              # 機能仕様書
├── plan.md              # 本ファイル（実装計画）
├── research.md          # フェーズ0 リサーチ結果
├── data-model.md        # フェーズ1 データモデル
├── quickstart.md        # フェーズ1 クイックスタート
├── contracts/           # フェーズ1 コントラクト変更仕様
│   └── catalog-changes.md
├── checklists/          # 品質チェックリスト
│   └── requirements.md
└── tasks.md             # フェーズ2 タスク一覧（/speckit.tasks で生成）
```

### ソースコード（リポジトリルート）

```text
src/
├── contracts/
│   └── catalog.ts              # ★変更: stock, keyword フィールド追加
│
├── domains/
│   └── catalog/
│       ├── types/
│       │   └── index.ts        # ★新規: ドメイン固有型定義
│       ├── api/
│       │   ├── usecases.ts     # ★置換: 本番ユースケース実装
│       │   └── index.ts        # ★変更: 再エクスポート → 本番実装エクスポート
│       └── ui/
│           ├── ProductCard.tsx  # ★置換: 在庫状況表示対応
│           ├── ProductList.tsx  # ★置換: 検索バー・在庫切れ表示対応
│           ├── ProductDetail.tsx # ★置換: 在庫数表示・在庫切れ時ボタン無効化
│           └── index.ts        # ★変更: 再エクスポート → 本番実装エクスポート
│
├── infrastructure/
│   └── repositories/
│       └── product.ts          # ★変更: stock追加、keyword検索対応、Unsplash画像URL
│
├── samples/
│   └── domains/catalog/        # ★変更: コントラクト変更に伴う型整合性更新
│
└── app/
    └── (buyer)/
        ├── layout.tsx          # ★変更: navLinks に商品一覧リンク追加
        └── catalog/
            ├── page.tsx        # ★変更: 検索バー統合、limit=12指定
            └── [id]/
                └── page.tsx    # ★変更: 在庫数表示対応

tests/
├── unit/
│   └── domains/
│       └── catalog/
│           ├── usecases.test.ts     # ★新規: ユースケース単体テスト
│           └── components.test.tsx   # ★新規: UIコンポーネント単体テスト
├── integration/
│   └── domains/
│       └── catalog/
│           └── api.test.ts          # ★新規: API統合テスト
└── e2e/
    └── catalog/
        └── buyer-catalog.spec.ts    # ★新規: 購入者カタログ閲覧E2Eテスト
```

**構造決定**: Next.js App Router のWebアプリケーション構造を採用。既存のドメイン分離パターン（domains/types+api+ui）に準拠し、テストは tests/ ディレクトリ配下にレイヤー別（unit/integration/e2e）で配置する。

## 実装フェーズ

### フェーズ1: コントラクト拡張とインフラ更新（基盤）

**目的**: 全ユーザーストーリーの基盤となるコントラクトとリポジトリを準備する。

**変更対象**:

1. `src/contracts/catalog.ts`
   - `ProductSchema` に `stock: z.number().int().min(0).default(0)` 追加
   - `GetProductsInputSchema` に `keyword: z.string().max(200).optional()` 追加
   - `CreateProductInputSchema` に `stock` フィールド追加
   - `UpdateProductInputSchema` に `stock` フィールド追加
   - `ProductRepository` インターフェースの `findAll` に `keyword` パラメータ追加
   - `ProductRepository` インターフェースの `count` パラメータを `filter` オブジェクトに変更

2. `src/infrastructure/repositories/product.ts`
   - サンプル商品データに `stock` フィールド追加
   - 商品画像URLを Unsplash の高品質画像に変更
   - `findAll` メソッドに keyword 検索ロジック追加（name, description の部分一致、大文字小文字区別なし）
   - `count` メソッドのシグネチャを filter オブジェクト対応に更新
   - サンプル商品を12件以上に拡充（ページネーション検証用）
   - 在庫0の商品を含める（在庫切れ表示検証用）

3. `src/samples/domains/catalog/` — コントラクト変更に伴う型整合性更新

**テスト**:
- `tests/unit/domains/catalog/usecases.test.ts`: コントラクトのバリデーションテスト
- `tests/integration/domains/catalog/api.test.ts`: リポジトリの検索・フィルタテスト

### フェーズ2: ユーザーストーリー1 — 商品一覧の閲覧（P1）

**目的**: 商品カードのグリッド表示、ページネーション、在庫切れ表示、空一覧表示を実装する。

**変更対象**:

1. `src/domains/catalog/types/index.ts`
   - ドメイン固有の型定義（Pagination インターフェースなど）

2. `src/domains/catalog/api/usecases.ts`
   - `getProducts` ユースケースの本番実装
   - サンプル実装をベースに、keyword 検索対応を追加

3. `src/domains/catalog/api/index.ts`
   - サンプル再エクスポートから本番実装エクスポートに変更

4. `src/domains/catalog/ui/ProductCard.tsx`
   - 在庫状況表示（在庫あり/在庫切れ）
   - 商品画像のプレースホルダーフォールバック

5. `src/domains/catalog/ui/ProductList.tsx`
   - カード形式グリッド表示（sm:2, lg:3, xl:4）
   - ページネーション（テンプレートパターン使用）
   - 空状態メッセージ「商品がありません」
   - ローディング・エラー状態

6. `src/domains/catalog/ui/index.ts`
   - サンプル再エクスポートから本番実装エクスポートに変更

7. `src/app/(buyer)/catalog/page.tsx`
   - `limit=12` でAPI呼び出し
   - ページネーション連携

8. `src/app/api/catalog/products/route.ts`
   - keyword クエリパラメータの受け渡し

**テスト**:
- 単体テスト: ProductCard（在庫切れ表示、プレースホルダー画像）、ProductList（グリッド表示、ページネーション、空状態）
- 統合テスト: GET /api/catalog/products（ページネーション、status フィルタ）
- E2Eテスト: 商品一覧表示、ページネーション遷移、在庫切れ表示、空一覧表示

### フェーズ3: ユーザーストーリー2 — 商品詳細の確認（P2）

**目的**: 商品詳細表示、在庫数表示、カート追加ボタン制御を実装する。

**変更対象**:

1. `src/domains/catalog/api/usecases.ts`
   - `getProductById` ユースケースの本番実装

2. `src/domains/catalog/ui/ProductDetail.tsx`
   - 在庫数の表示
   - 在庫切れ時のカート追加ボタン無効化
   - 商品画像プレースホルダー
   - 戻るボタン

3. `src/app/(buyer)/catalog/[id]/page.tsx`
   - 在庫数対応（ProductDetail への stock 渡し）

**テスト**:
- 単体テスト: ProductDetail（在庫数表示、在庫切れ時ボタン無効化、プレースホルダー画像）
- 統合テスト: GET /api/catalog/products/:id（正常系、404系）
- E2Eテスト: 商品詳細遷移、在庫切れボタン無効化、戻るボタン

### フェーズ4: ユーザーストーリー3 — 商品検索（P3）

**目的**: キーワード検索機能、検索結果なし表示、検索クリアを実装する。

**変更対象**:

1. `src/domains/catalog/ui/ProductList.tsx`
   - SearchBar テンプレートコンポーネントの統合

2. `src/app/(buyer)/catalog/page.tsx`
   - SearchBar からのキーワード取得
   - keyword パラメータ付きAPI呼び出し
   - 検索クリアで keyword なしの再取得

**テスト**:
- 単体テスト: SearchBar 統合のテスト（キーワード入力、クリア）
- 統合テスト: GET /api/catalog/products?keyword=xxx（該当あり、該当なし）
- E2Eテスト: キーワード検索、検索結果なしメッセージ、検索クリア

### フェーズ5: ナビゲーション追加と最終確認

**目的**: 購入者レイアウトにリンクを追加し、全体の統合確認を行う。

**変更対象**:

1. `src/app/(buyer)/layout.tsx`
   - navLinks に `{ href: '/catalog', label: '商品一覧' }` を追加

**テスト**:
- E2Eテスト: ナビゲーションから商品一覧への遷移
- 全体E2Eテスト: 商品一覧→詳細→戻る→検索の一連フロー
- カバレッジ確認: 80%以上を確認

## 複雑さの追跡

> 憲法チェックに違反がないため、この表は空です。

| 違反 | 必要な理由 | よりシンプルな代替案を却下した理由 |
|------|----------|-------------------------------|
| なし | — | — |
