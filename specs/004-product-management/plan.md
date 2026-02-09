# 実装計画書: 商品管理機能

**ブランチ**: `004-product-management` | **日付**: 2026-02-09 | **仕様書**: [spec.md](spec.md)
**入力**: `specs/004-product-management/spec.md`

## 概要

管理者が商品の登録・編集・削除・ステータス管理を行える機能を、独立した product ドメインとして新規実装する。CQRS の考え方を適用し、既存 catalog ドメイン（購入者向け読み取り）と product ドメイン（管理者向け書き込み）を明確に分離する。contract の CRUD 部分を product 側に移動し、catalog API Routes を読み取り専用にリファクタリングする。

## 技術コンテキスト

**言語/バージョン**: TypeScript 5 + React 18 + Next.js 14 (App Router)
**主要ライブラリ**: Zod（バリデーション）、Tailwind CSS 3（スタイリング）
**ストレージ**: インメモリ（`globalThis.__productStore`）— 既存 `productRepository` を共有
**テスト**: Vitest 1.6（単体・統合）、Playwright 1.45（E2E）
**対象プラットフォーム**: Web ブラウザ（デスクトップ）
**プロジェクト種別**: Next.js App Router Web アプリケーション

## 憲章チェック

| 原則 | 評価 | 根拠 |
|------|------|------|
| I. テンプレート駆動開発 | ✅ 準拠 | `src/templates/` のパターンを使用、`validate()` / `success()` / `error()` を使用 |
| II. ドメイン分離 | ✅ 準拠 | `src/domains/product/` を新規作成、catalog とは独立した API・UI |
| III. テストファースト | ✅ 準拠 | TDD（Red → Green → Refactor）を徹底、カバレッジ 80% 以上 |
| IV. 実装ワークフロー | ✅ 準拠 | 管理者レイアウトの navLinks 解除、スコープ外機能の除外、spec.md 準拠 |

### 注意事項

- navLinks 変更時は spec.md のスコープに含まれないリンクやページが残っていないか監査すること
- catalog ドメインから書き込みスタブを削除する際、既存テストへの影響を確認すること
- catalog と product が同じ `productRepository` を共有するため、テストデータのリセットが両ドメインに影響する点を考慮

## プロジェクト構造

### ドキュメント（本機能）

```text
specs/004-product-management/
├── spec.md
├── plan.md              # 本ファイル
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit.tasks で生成
```

### ソースコード（新規作成・変更ファイル）

```text
# 新規作成
src/domains/product/
├── api/
│   └── index.ts              # ユースケース: createProduct, updateProduct, deleteProduct, getProducts, getProductById, updateProductStatus
└── ui/
    ├── index.tsx             # AdminProductList, ProductForm
    └── admin.tsx             # AdminProductDetail（編集ページ用）

src/contracts/product.ts      # CRUD 操作スキーマ（catalog.ts から移動）
src/app/api/products/
├── route.ts                  # GET（一覧）, POST（登録）
└── [id]/
    ├── route.ts              # GET（詳細）, PUT（更新）, DELETE（削除）
    └── status/
        └── route.ts          # PATCH（ステータス変更）

tests/unit/domains/product/
├── usecase.test.ts
└── ui.test.tsx
tests/integration/domains/product/
└── api.test.ts
tests/e2e/products/
├── admin-flow.spec.ts
└── buyer-access.spec.ts

# 変更（リファクタリング）
src/contracts/catalog.ts              # CRUD スキーマを product.ts に移動、読み取り用のみ残す
src/domains/catalog/api/index.ts      # CRUD スタブ・NotImplementedError を削除
src/app/api/catalog/products/route.ts        # POST ハンドラを削除
src/app/api/catalog/products/[id]/route.ts   # PUT/DELETE ハンドラを削除
src/app/admin/layout.tsx              # navLinks に「商品管理」を追加
src/app/admin/products/page.tsx       # スタブ → AdminProductList
src/app/admin/products/new/page.tsx   # スタブ → ProductForm
src/app/admin/products/[id]/edit/page.tsx  # スタブ → ProductForm（編集モード）
src/infrastructure/repositories/index.ts   # productRepository は変更なし（そのまま共有）
```

**構造の判断根拠**: 憲章 II（ドメイン分離）に従い、`src/domains/product/` を新規作成。catalog ドメインの読み取り操作と product ドメインの書き込み操作を CQRS パターンで分離する。リポジトリ層（`src/infrastructure/repositories/product.ts`）は共有し、ドメイン層で責務を分離する。

## CQRS 分離設計

### contract の分離

**変更前（catalog.ts にすべて含まれている）**:
- Product エンティティ、ステータス
- GetProductsInput/Output（読み取り）
- GetProductByIdInput/Output（読み取り）
- CreateProductInput/Output（書き込み）
- UpdateProductInput/Output（書き込み）
- DeleteProductInput/Output（書き込み）
- ProductRepository インターフェース

**変更後**:

`src/contracts/catalog.ts`（読み取り専用）:
- Product エンティティ、ProductStatus、ProductSchema
- GetProductsInput/Output
- GetProductByIdInput/Output
- ProductRepository インターフェース

`src/contracts/product.ts`（書き込み操作）:
- catalog.ts から Product、ProductRepository を再エクスポート
- CreateProductInput/Output
- UpdateProductInput/Output
- UpdateProductStatusInput/Output（新規）
- DeleteProductInput/Output

### ドメインの責務分離

| ドメイン | 責務 | ユースケース | API パス |
|---------|------|-------------|---------|
| catalog | 購入者向け商品閲覧（読み取り専用） | getProducts, getProductById | /api/catalog/products |
| product | 管理者向け商品管理（CRUD + ステータス変更） | getProducts, getProductById, createProduct, updateProduct, updateProductStatus, deleteProduct | /api/products |

### リポジトリ共有

```text
productRepository (src/infrastructure/repositories/product.ts)
  ├── catalog ドメイン（findAll, findById, count のみ使用）
  └── product ドメイン（全メソッド使用: findAll, findById, count, create, update, delete）
```

## 実装アプローチ

### フェーズ 1: セットアップ

1. `src/contracts/product.ts` を新規作成（CRUD スキーマを catalog.ts から移動）
2. `src/contracts/catalog.ts` を読み取り専用にリファクタリング
3. `src/domains/product/` ディレクトリを作成（api/, ui/ サブディレクトリ）
4. テストディレクトリを作成

### フェーズ 2: 基盤 — ドメイン API ユースケース

1. product ドメインの全ユースケースの単体テストを作成（Red）
2. ユースケースを実装（Green）
3. 統合テストを作成・通過

### フェーズ 3: US1 — 商品一覧表示とステータス変更

1. AdminProductList コンポーネントのテストを作成
2. AdminProductList を実装
3. API Routes（GET /api/products, PATCH /api/products/:id/status）を作成
4. 管理者ページのスタブを本番実装に置き換え
5. navLinks の更新

### フェーズ 4: US2 — 商品新規登録

1. ProductForm コンポーネントのテストを作成
2. ProductForm を実装（新規登録モード）
3. API Routes（POST /api/products）を作成
4. 新規登録ページのスタブを置き換え

### フェーズ 5: US3 — 商品編集

1. ProductForm（編集モード）のテストを作成
2. ProductForm の編集モードを実装
3. API Routes（GET /api/products/:id, PUT /api/products/:id）を作成
4. 編集ページのスタブを置き換え

### フェーズ 6: US4 — 商品削除

1. 削除機能のテストを作成
2. AdminProductList に削除ボタン + ConfirmDialog を統合
3. API Routes（DELETE /api/products/:id）を作成

### フェーズ 7: CQRS リファクタリング

1. catalog ドメインから書き込みスタブを削除
2. catalog API Routes を読み取り専用にリファクタリング
3. 既存 catalog テストへの影響を確認・修正

### フェーズ 8: E2E テスト

1. 管理者フロー E2E テストを作成
2. 購入者アクセス拒否 E2E テストを作成

### フェーズ 9: ポリッシュ

1. TypeScript コンパイルチェック
2. ESLint チェック
3. テストカバレッジ確認（80% 以上）
