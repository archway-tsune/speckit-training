# 実装計画書: カート管理機能

**ブランチ**: `002-cart-management` | **作成日**: 2026-02-09 | **仕様書**: [spec.md](spec.md)
**入力**: `/specs/002-cart-management/spec.md` の機能仕様書

## 概要

購入者が商品をカートに追加し、数量変更・削除・合計確認を行えるカート管理機能を実装する。`src/domains/cart/` のスタブ（NotImplementedError / プレースホルダー）を本番実装に置き換え、`src/contracts/cart.ts` のインターフェースに準拠して開発する。`src/samples/domains/cart/` のサンプル実装を参考に、TDD（Red → Green → Refactor）を徹底する。

## 技術コンテキスト

**言語/バージョン**: TypeScript 5 (strict モード) + React 18
**フレームワーク**: Next.js 14 (App Router)
**主要依存**: Tailwind CSS 3, Zod（バリデーション）
**ストレージ**: インメモリストア（`globalThis` キャッシング、`src/infrastructure/repositories/cart.ts` に実装済み）
**テスト**: Vitest 1.6（単体・統合）、Playwright 1.45（E2E）、React Testing Library 16
**対象プラットフォーム**: Web ブラウザ
**プロジェクト種別**: Web アプリケーション（Next.js App Router）
**パフォーマンス目標**: カート追加操作 3 秒以内、数量変更後 1 秒以内に合計更新
**制約**: インメモリストア（DB 永続化は将来フェーズ）、消費税一律 10%
**スケール/スコープ**: 購入者向けカート CRUD 4 エンドポイント + カートページ 1 画面 + 商品詳細ページ改修

## 憲章チェック

*ゲート: Phase 0 リサーチ前に確認必須。Phase 1 設計後に再チェック。*

| 原則 | 判定 | 根拠 |
|------|------|------|
| I. テンプレート駆動開発 | ✅ 適合 | `src/templates/` の ConfirmDialog、QuantitySelector、Empty、Error、Loading を使用。API は `validate()` + `success()`/`error()` パターンに準拠 |
| II. ドメイン分離 | ✅ 適合 | `src/domains/cart/` に api/ と ui/ を独立配置。商品データは `ProductFetcher` インターフェース経由で参照（直接 import なし） |
| III. テストファースト | ✅ 適合 | TDD（Red → Green → Refactor）を徹底。各ユースケースにテストタスクを含める |
| IV. 実装ワークフロー | ✅ 適合 | スタブ置換パターン。spec.md スコープ外の機能は実装しない。navLinks のカートリンクを有効化する際にスコープ外リンクがないか監査する |
| 品質基準 | ✅ 適合 | TypeScript strict エラー 0 件、ESLint エラー 0 件、カバレッジ 80% 以上を目標 |
| 命名規約 | ✅ 適合 | ファイル名 kebab-case、コンポーネント PascalCase、関数 camelCase |
| ドキュメント言語 | ✅ 適合 | すべて日本語で記述 |

**ゲート判定**: ✅ 全原則に適合。Phase 0 に進む。

## プロジェクト構造

### ドキュメント（本フィーチャー）

```text
specs/002-cart-management/
├── plan.md              # 本ファイル（/speckit.plan 出力）
├── research.md          # Phase 0 出力（リサーチ結果）
├── data-model.md        # Phase 1 出力（データモデル）
├── quickstart.md        # Phase 1 出力（クイックスタート）
├── contracts/
│   └── cart-api.md      # Phase 1 出力（API 契約）
└── tasks.md             # Phase 2 出力（/speckit.tasks で生成）
```

### ソースコード（リポジトリルート）

```text
src/
├── contracts/
│   └── cart.ts                          # 既存: Zod スキーマ・インターフェース定義（ProductFetcher に stock 追加）
├── domains/cart/
│   ├── api/
│   │   └── index.ts                     # 変更: スタブ → 本番ユースケース実装（getCart, addToCart, updateCartItem, removeFromCart）
│   └── ui/
│       └── index.tsx                    # 変更: プレースホルダー → CartView コンポーネント
├── infrastructure/repositories/
│   └── cart.ts                          # 既存: インメモリ CartRepository + ProductFetcher 実装
├── app/(buyer)/
│   ├── layout.tsx                       # 変更: navLinks のカートリンクをコメント解除
│   ├── cart/
│   │   └── page.tsx                     # 既存: CartView をインポートして表示
│   └── catalog/[id]/
│       └── page.tsx                     # 変更: 「カートに追加」ボタンと在庫チェック追加
└── app/api/cart/
    ├── route.ts                         # 既存: GET /api/cart → getCart
    └── items/
        ├── route.ts                     # 既存: POST /api/cart/items → addToCart
        └── [productId]/
            └── route.ts                 # 既存: PUT/DELETE /api/cart/items/:productId → updateCartItem/removeFromCart

tests/
├── unit/domains/cart/
│   ├── usecase.test.ts                  # 新規: ユースケース単体テスト
│   └── ui.test.tsx                      # 新規: CartView UI コンポーネントテスト
├── integration/domains/cart/
│   └── api.test.ts                      # 新規: API 統合テスト
└── e2e/cart/
    └── buyer-flow.spec.ts               # 新規: 購入者カートフロー E2E テスト
```

**構造決定**: 既存の Next.js App Router 構造に従い、`src/domains/cart/` 内のスタブを本番実装に置き換える。ページ・API Routes は配置済みのため、ドメインロジックの実装に集中する。

## 実装方針

### 契約変更

1. **`src/contracts/cart.ts` の `ProductFetcher` インターフェース**: `findById()` の返り値に `stock: number` フィールドを追加。これにより在庫チェックがドメイン API レイヤーで可能になる。
2. **`src/infrastructure/repositories/cart.ts` の `productFetcher` 実装**: `stock` フィールドを返すように更新。

### ドメイン API 実装（`src/domains/cart/api/index.ts`）

`src/samples/domains/cart/api/usecases.ts` を参考に、以下のユースケースを実装:

- **getCart**: セッションからユーザー特定、カート取得（なければ空カート自動作成）
- **addToCart**: 商品存在確認、在庫チェック、既存アイテムなら数量加算、新規ならアイテム追加
- **updateCartItem**: カートアイテム存在確認、在庫チェック、数量更新
- **removeFromCart**: カートアイテム存在確認、アイテム削除

共通パターン:
- `authorize(context, 'buyer')` で認証・認可チェック
- `validate(schema, input)` でバリデーション
- `success(data)` / `error(err)` でレスポンスラップ
- 各エラー（NotFoundError, ValidationError, CartItemNotFoundError）の適切な使い分け

### ドメイン UI 実装（`src/domains/cart/ui/index.tsx`）

`src/samples/domains/cart/ui/CartView.tsx` を参考に、以下を実装:

- **CartView**: カート一覧表示（商品画像・名前・単価・数量・小計）
- **金額表示**: 商品合計（subtotal）、消費税（`Math.floor(subtotal * 0.1)`）、総合計
- **数量変更**: QuantitySelector テンプレート使用、API 呼び出し + 即時更新
- **商品削除**: ConfirmDialog テンプレート使用、確認後に API 呼び出し
- **空カート**: Empty テンプレート使用 + 商品一覧ページへのリンク
- **カート追加ボタン**: 商品詳細ページに追加。在庫切れ時は disabled。成功時にフィードバック表示 + `cart-updated` イベント発火

### 認証リダイレクト

- カートページ: セッションチェック → 未ログインなら `/login?redirect=/cart` にリダイレクト
- 商品詳細ページのカート追加: API 401 レスポンス → `/login?redirect=/catalog/{id}` にリダイレクト

### ナビゲーション更新

- `src/app/(buyer)/layout.tsx` の navLinks でカートリンク `{ href: '/cart', label: 'カート' }` をコメント解除
- spec.md スコープ外のリンクが含まれていないか監査する

## Phase 1 設計後 憲章再チェック

| 原則 | 判定 | 根拠 |
|------|------|------|
| I. テンプレート駆動開発 | ✅ 適合 | ConfirmDialog, QuantitySelector, Empty, Error, Loading テンプレートを使用。validate() + success()/error() パターン準拠 |
| II. ドメイン分離 | ✅ 適合 | ProductFetcher に stock 追加は contracts 経由。ドメイン間直接 import なし |
| III. テストファースト | ✅ 適合 | 各ユースケースに Red → Green → Refactor のテストタスクを含める |
| IV. 実装ワークフロー | ✅ 適合 | スタブ置換、navLinks 監査、spec.md スコープ外機能なし |

**ゲート判定**: ✅ 設計後も全原則に適合。
