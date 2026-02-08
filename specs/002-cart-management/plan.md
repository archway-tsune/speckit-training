# 実装計画: カート管理

**ブランチ**: `002-cart-management` | **作成日**: 2026-02-08 | **仕様書**: [spec.md](./spec.md)
**入力**: `specs/002-cart-management/spec.md`

## 概要

購入者が商品をカートに追加し、内容の確認・数量変更・削除を行える機能を実装する。既存の `src/contracts/cart.ts` と `src/samples/domains/cart/` を基に、`src/domains/cart/` を本番実装に置き換える。TDD（Red → Green → Refactor）を厳守し、ユーザーストーリー単位でフェーズを分割する。

## 技術コンテキスト

**言語/バージョン**: TypeScript 5（strict mode）
**主要依存関係**: Next.js 14（App Router）、React 18、Tailwind CSS 3、Zod
**ストレージ**: インメモリ（`globalThis.__cartStore`）— 既存リポジトリをそのまま使用
**テスト**: Vitest（単体・統合）、Playwright（E2E）
**対象プラットフォーム**: Web ブラウザ
**プロジェクト種別**: Web アプリケーション
**パフォーマンス目標**: カート追加2秒以内、ページ表示1秒以内、数量変更0.5秒以内
**制約**: 消費税10%（端数切り捨て）、数量1〜99、在庫数以下
**スケール**: ECサイトトレーニングプロジェクト

## 憲法チェック

*ゲート: Phase 0 前に合格必須。Phase 1 デザイン後に再チェック。*

| 原則 | 準拠状況 | 説明 |
|------|---------|------|
| I. テンプレート駆動開発 | ✅ 準拠 | `src/templates/` のコンポーネント（ConfirmDialog, QuantitySelector, Loading, Error, Empty）を使用。`src/foundation/` のバリデーション・エラーハンドリングを使用 |
| II. ドメイン分離 | ✅ 準拠 | `src/domains/cart/` に types/api/ui サブディレクトリで実装。カタログドメインへの依存は ProductFetcher インターフェース経由 |
| III. テストファースト | ✅ 準拠 | TDD（Red → Green → Refactor）を厳守。各ユーザーストーリーにテストタスクを含む。カバレッジ80%以上を目標 |
| IV. 実装ワークフロー | ✅ 準拠 | `src/domains/cart/` のスキャフォールドを本番実装に置き換え。`src/contracts/cart.ts` に準拠。navLinks にカートリンク追加 |

## プロジェクト構造

### ドキュメント（本フィーチャー）

```text
specs/002-cart-management/
├── plan.md              # 本ファイル
├── research.md          # Phase 0 リサーチ結果
├── data-model.md        # Phase 1 データモデル
├── quickstart.md        # Phase 1 クイックスタート
├── contracts/           # Phase 1 API コントラクト
│   └── cart-api.md
├── checklists/          # 品質チェックリスト
│   └── requirements.md
└── tasks.md             # Phase 2 タスク一覧（/speckit.tasks で生成）
```

### ソースコード（リポジトリルート）

```text
src/
├── contracts/
│   └── cart.ts                    # 既存 — 変更なし
├── domains/cart/
│   ├── types/index.ts             # 新規: カート用型定義（TaxCalculation等）
│   ├── api/
│   │   ├── usecases.ts            # 新規: 本番ユースケース
│   │   └── index.ts               # 既存 → 本番エクスポートに置き換え
│   └── ui/
│       ├── CartView.tsx            # 新規: 本番カート表示コンポーネント
│       ├── CartItem.tsx            # 新規: カートアイテム行コンポーネント
│       ├── CartSummary.tsx         # 新規: 合計・消費税表示コンポーネント
│       └── index.ts               # 既存 → 本番エクスポートに置き換え
├── app/(buyer)/
│   ├── cart/page.tsx              # 既存 → 本番カートページに更新
│   ├── catalog/[id]/page.tsx      # 既存 → カート追加ロジック統合
│   └── layout.tsx                 # 既存 → navLinks にカートリンク追加
└── infrastructure/repositories/
    └── cart.ts                    # 既存 — 変更なし

tests/
├── unit/domains/cart/
│   ├── usecases.test.ts           # 新規: ユースケース単体テスト
│   └── components.test.tsx        # 新規: UIコンポーネント単体テスト
├── integration/domains/cart/
│   └── api.test.ts                # 新規: API統合テスト
└── e2e/cart/
    └── buyer-cart.spec.ts         # 新規: E2Eテスト
```

**構造の決定**: カタログ機能（001）と同じパターンを踏襲。ドメイン内部を types/api/ui に分離し、既存のスキャフォールド（samples 再エクスポート）を本番実装に置き換える。

## 複雑さの追跡

> 憲法違反なし — このセクションは不要。

## 実装方針

### カタログドメインとの統合

- 商品詳細ページ（`src/app/(buyer)/catalog/[id]/page.tsx`）に「カートに追加」ロジックを実装
- `ProductDetail` コンポーネントの `onAddToCart` コールバックを活用
- POST `/api/cart/items` を呼び出し、成功時に `dispatchCartUpdated()` でヘッダーを更新
- 二重送信防止: API呼び出し中はボタンを disabled にする loading 状態管理

### 消費税計算

- 計算はUI側（CartSummary コンポーネント）で実施
- `Math.floor(subtotal * 0.1)` で端数切り捨て
- サーバー側リポジトリの subtotal はそのまま使用（税込金額はクライアント表示のみ）

### 既存コントラクトの活用

- `src/contracts/cart.ts` の全スキーマ・インターフェースをそのまま使用
- スキーマ変更は不要 — 既存定義がすべての要件をカバー
- `CartRepository` と `ProductFetcher` インターフェースに準拠

### ナビゲーション追加

- `src/app/(buyer)/layout.tsx` の navLinks に `{ href: '/cart', label: 'カート' }` を追加
- 既にコメントアウトされた行があるため、コメントを外す形で実装
