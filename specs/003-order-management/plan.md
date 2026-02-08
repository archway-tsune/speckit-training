# 実装計画: 注文機能

**ブランチ**: `003-order-management` | **日付**: 2026-02-08 | **仕様**: [spec.md](spec.md)
**入力**: `specs/003-order-management/spec.md` の機能仕様書

## 概要

購入者がカート内容からチェックアウト→注文確定→注文履歴閲覧を行い、管理者が全注文の一覧閲覧とステータス更新を行える機能を実装する。`src/domains/orders/` のスキャフォールド（samples 再エクスポート）を本番実装に段階的に置き換え、ステータス遷移はコントラクトの `ValidStatusTransitions` マップによるステートマシンパターンで厳密に管理する。

## 技術コンテキスト

**言語/バージョン**: TypeScript 5 (strict mode)
**主要依存**: Next.js 14 (App Router), React 18, Tailwind CSS 3, Zod
**ストレージ**: インメモリ（`globalThis.__orderStore`）
**テスト**: Vitest（単体・統合）、Playwright（E2E）
**ターゲットプラットフォーム**: Web（ブラウザ）
**プロジェクトタイプ**: Web アプリケーション（Next.js フルスタック）
**パフォーマンス目標**: 一覧ページ初回ロード3秒以内
**制約**: インメモリ永続化（DB は将来フェーズ）
**スケール**: トレーニング用ECサイト

## 憲法チェック

*ゲート: Phase 0 リサーチ前に確認必須。Phase 1 設計後に再チェック。*

| 原則 | 状態 | 備考 |
|------|------|------|
| I. テンプレート駆動開発 | PASS | templates/ の UI コンポーネント（StatusBadge, Pagination, Empty, Loading, Error）を使用 |
| II. ドメイン分離 | PASS | `src/domains/orders/` に独立実装。api/, ui/, types/ サブディレクトリ。ドメイン間依存は API 経由のみ |
| III. テストファースト | PASS | TDD（Red → Green → Refactor）を厳守。各ユースケースにテストタスクを含める |
| IV. 実装ワークフロー | PASS | samples 再エクスポートを本番実装に段階的置換。spec.md のスコープ外機能は実装しない。navLinks 追加あり |
| 品質基準 | PASS | TypeScript strict エラー0件、カバレッジ80%以上、E2E で主要導線カバー |
| 命名規約 | PASS | kebab-case ファイル名、PascalCase コンポーネント、camelCase 関数 |

**ゲート結果**: 全原則 PASS。Phase 0 に進行。

## プロジェクト構造

### ドキュメント（この機能）

```text
specs/003-order-management/
├── plan.md              # 本ファイル
├── research.md          # リサーチ結果
├── data-model.md        # データモデル・ステートマシン定義
├── quickstart.md        # テストシナリオ
├── contracts/
│   └── api.md           # API コントラクト
├── checklists/
│   └── requirements.md  # 仕様品質チェックリスト
└── tasks.md             # タスク一覧（/speckit.tasks で生成）
```

### ソースコード（変更・追加対象）

```text
src/
├── domains/orders/
│   ├── api/
│   │   ├── usecases.ts         # 本番ユースケース（新規作成）
│   │   └── index.ts            # エクスポート切り替え（samples → 本番）
│   ├── types/
│   │   └── index.ts            # ステートマシン型・ヘルパー（新規作成）
│   └── ui/
│       ├── OrderList.tsx        # 注文一覧コンポーネント（新規作成）
│       ├── OrderDetail.tsx      # 注文詳細コンポーネント（新規作成）
│       ├── CheckoutView.tsx     # チェックアウト画面コンポーネント（新規作成）
│       ├── OrderComplete.tsx    # 注文完了画面コンポーネント（新規作成）
│       └── index.ts            # エクスポート切り替え（samples → 本番）
├── app/
│   ├── (buyer)/
│   │   ├── layout.tsx          # navLinks に注文履歴リンク追加
│   │   ├── checkout/page.tsx   # 既存（ドメインUIに依存）
│   │   └── orders/
│   │       ├── page.tsx        # 購入者注文一覧ページ（新規作成）
│   │       └── [id]/page.tsx   # 購入者注文詳細ページ（新規作成）
│   └── admin/
│       ├── layout.tsx          # navLinks に注文管理リンク追加
│       └── orders/
│           ├── page.tsx        # 既存（ドメインUIに依存）
│           └── [id]/page.tsx   # 既存（ドメインUIに依存）

tests/
├── unit/domains/orders/
│   ├── usecases.test.ts        # ユースケース単体テスト
│   └── components.test.tsx     # UIコンポーネント単体テスト
├── integration/domains/orders/
│   └── api.test.ts             # API統合テスト
└── e2e/orders/
    ├── buyer-checkout.spec.ts  # 購入者チェックアウトE2E
    ├── buyer-orders.spec.ts    # 購入者注文履歴E2E
    └── admin-orders.spec.ts    # 管理者注文管理E2E
```

**構造決定**: 既存のドメイン分離パターン（catalog, cart と同じ構造）に従う。`src/domains/orders/` に api/types/ui サブディレクトリを配置し、本番実装で samples の再エクスポートを置き換える。

## 実装方針

### 1. スキャフォールド置き換え戦略

既存の `src/domains/orders/api/index.ts` と `src/domains/orders/ui/index.ts` は samples を再エクスポートしている。これをフェーズごとに本番実装に切り替える:

- **Phase 3 (US1)**: `createOrder` を本番 usecases に切り替え、`getOrderById` も追加
- **Phase 4 (US2)**: `getOrders` を本番 usecases に切り替え、OrderList/OrderDetail UI を本番に切り替え
- **Phase 5 (US3)**: 管理者用 UI は既存ページがドメインUIに依存しているため、UI エクスポートの切り替えで対応
- **Phase 6 (US4)**: `updateOrderStatus` を本番 usecases に切り替え

### 2. ステートマシンパターン

`src/contracts/orders.ts` に定義済みの `ValidStatusTransitions` マップを使用:

```typescript
// コントラクトで定義済み
export const ValidStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};
```

`src/domains/orders/types/index.ts` にヘルパー関数を追加:
- `getValidTransitions(currentStatus)`: 現在のステータスから遷移可能なステータス一覧を返す
- `canTransitionTo(currentStatus, targetStatus)`: 遷移可能かどうかを判定する
- `isTerminalStatus(status)`: 最終状態かどうかを判定する

### 3. 既存ページ・APIルートの活用

- **API ルート**: `src/app/api/orders/route.ts` と `src/app/api/orders/[id]/route.ts` は既存。ドメインの `api/index.ts` からインポートしているため、usecases 切り替えで自動的に本番コードが適用される
- **管理者ページ**: `src/app/admin/orders/page.tsx` と `src/app/admin/orders/[id]/page.tsx` は既存。ドメインUIコンポーネントの切り替えで対応
- **チェックアウトページ**: `src/app/(buyer)/checkout/page.tsx` は既存。必要に応じてドメインUIコンポーネントを使用するよう更新
- **購入者注文ページ**: `src/app/(buyer)/orders/page.tsx` と `src/app/(buyer)/orders/[id]/page.tsx` は新規作成が必要

### 4. ナビゲーションリンク追加

- **購入者レイアウト**: `src/app/(buyer)/layout.tsx` の navLinks に `{ href: '/orders', label: '注文履歴' }` を追加
- **管理者レイアウト**: `src/app/admin/layout.tsx` の navLinks に `{ href: '/admin/orders', label: '注文管理' }` を追加

### 5. テスト戦略

TDD（Red → Green → Refactor）を厳守:

- **単体テスト**: ユースケース（createOrder, getOrders, getOrderById, updateOrderStatus）のビジネスロジック、ステートマシンヘルパー、UIコンポーネントの表示・インタラクション
- **統合テスト**: API ルートの HTTP リクエスト/レスポンス、リポジトリの CRUD 操作
- **E2E テスト**: 購入者のチェックアウトフロー、注文履歴閲覧、管理者の注文管理・ステータス更新

## 複雑さトラッキング

> 憲法チェックに違反がないため、このセクションは適用外。

## 憲法チェック（Phase 1 設計後 再評価）

| 原則 | 状態 | 備考 |
|------|------|------|
| I. テンプレート駆動開発 | PASS | StatusBadge, Pagination, Empty, Loading, Error テンプレートを使用 |
| II. ドメイン分離 | PASS | orders ドメインは独立。カートとの連携は CartFetcher インターフェース経由 |
| III. テストファースト | PASS | 各フェーズでテスト先行。Red 確認必須 |
| IV. 実装ワークフロー | PASS | samples → 本番の段階的置換。spec.md スコープ外機能は除外。navLinks 追加計画済み |
| 品質基準 | PASS | カバレッジ80%以上目標。E2E で購入者・管理者の主要導線カバー |

**最終ゲート結果**: 全原則 PASS。実装準備完了。
