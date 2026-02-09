# 実装計画書: 注文機能

**ブランチ**: `003-order-management` | **作成日**: 2026-02-09 | **仕様書**: [spec.md](./spec.md)
**入力**: `specs/003-order-management/spec.md` の機能仕様

## 概要

購入者がカート内の商品からチェックアウト→注文確定→注文履歴閲覧を行い、管理者が全注文の一覧閲覧・ステータス更新を行う注文機能を実装する。`src/domains/orders/` のスタブ（NotImplementedError / プレースホルダー）を本番実装に置き換え、既存の API Routes とページが自動的に動作する構成とする。ステータス遷移はステートマシンパターンで厳密に管理する。

## 技術コンテキスト

**言語/バージョン**: TypeScript 5（strict モード）+ React 18 + Next.js 14（App Router）
**主要依存**: Tailwind CSS 3、Zod（バリデーション）
**ストレージ**: インメモリ（`globalThis.__orderStore`、`src/infrastructure/repositories/order.ts` 実装済み）
**テスト**: Vitest 1.6（単体・統合）+ Playwright 1.45（E2E）+ React Testing Library 16
**対象プラットフォーム**: Web ブラウザ（デスクトップ・モバイル）
**プロジェクト種別**: Web アプリケーション（Next.js App Router）
**パフォーマンス目標**: 一覧ページ初回ロード 3 秒以内
**制約**: セッションベース Cookie 認証、RBAC（buyer/admin）
**規模**: 4 ユーザーストーリー、購入者 3 画面 + 管理者 2 画面

## 憲章チェック

*ゲート: Phase 0 リサーチ前に通過必須。Phase 1 設計後に再チェック。*

| 原則 | 準拠状況 | 根拠 |
|------|----------|------|
| I. テンプレート駆動開発 | 準拠 | `src/templates/` の UI コンポーネント（Loading, Error, Empty, StatusBadge, Pagination, ConfirmDialog）を使用。バリデーションに `validate()`、レスポンスに `success()`/`error()` を使用 |
| II. ドメイン分離 | 準拠 | `src/domains/orders/api/`（ユースケース）と `src/domains/orders/ui/`（コンポーネント）に分離。`src/contracts/orders.ts` に準拠 |
| III. テストファースト | 準拠 | TDD Red → Green → Refactor を徹底。各ユーザーストーリーにテストタスクを含む |
| IV. 実装ワークフロー | 準拠 | スタブ置換パターン。navLinks のコメント解除（購入者: 注文履歴、管理者: 注文管理）。spec.md スコープ外のリンク監査を実施 |
| 品質基準 | 準拠 | TypeScript strict エラー 0 件、ESLint エラー 0 件、カバレッジ 80% 以上 |

**ゲート結果**: 全原則準拠 — Phase 0 に進行可能

## プロジェクト構造

### ドキュメント（本フィーチャー）

```text
specs/003-order-management/
├── plan.md              # 本ファイル
├── research.md          # Phase 0 出力
├── data-model.md        # Phase 1 出力
├── quickstart.md        # Phase 1 出力
├── contracts/           # Phase 1 出力（API 契約）
├── checklists/          # 品質チェックリスト
│   └── requirements.md
└── tasks.md             # /speckit.tasks で生成
```

### ソースコード（リポジトリルート）

```text
src/
├── contracts/orders.ts              # 注文契約（Zod スキーマ、ステータス遷移ルール）※既存
├── domains/orders/
│   ├── api/index.ts                 # ユースケース（スタブ → 本番実装に置換）
│   └── ui/
│       ├── index.tsx                # 購入者向け UI（OrderList, OrderDetail, CheckoutView, OrderCompletePage）
│       └── admin.tsx                # 管理者向け UI（AdminOrderList, AdminOrderDetail）
├── app/(buyer)/
│   ├── cart/page.tsx                # カートページ（「注文手続きへ」ボタン追加）
│   ├── checkout/page.tsx            # チェックアウトページ（新規作成）
│   ├── orders/
│   │   ├── page.tsx                 # 注文履歴ページ（スタブ → 本番に置換）
│   │   └── [id]/page.tsx            # 注文詳細ページ（スタブ → 本番に置換）
│   ├── order-complete/page.tsx      # 注文完了ページ（新規作成）
│   └── layout.tsx                   # navLinks コメント解除（注文履歴）
├── app/admin/
│   ├── orders/
│   │   ├── page.tsx                 # 管理者注文一覧（スタブ → 本番に置換）
│   │   └── [id]/page.tsx            # 管理者注文詳細（スタブ → 本番に置換）
│   └── layout.tsx                   # navLinks コメント解除（注文管理）
└── app/api/orders/                  # API Routes（既存、スタブ置換で自動動作）
    ├── route.ts                     # GET /api/orders, POST /api/orders
    └── [id]/route.ts                # GET /api/orders/:id, PATCH /api/orders/:id/status

tests/
├── unit/domains/orders/
│   ├── usecase.test.ts              # ユースケース単体テスト
│   └── ui.test.tsx                  # UI コンポーネント単体テスト
├── integration/domains/orders/
│   └── api.test.ts                  # 統合テスト
└── e2e/orders/
    ├── buyer-flow.spec.ts           # 購入者導線 E2E
    └── admin-flow.spec.ts           # 管理者導線 E2E
```

**構造判断**: 既存の Next.js App Router 構造に従う。購入者向け UI と管理者向け UI を別ファイルに分離し、各ページから適切なコンポーネントをインポートする。チェックアウトページと注文完了ページは新規作成。

## 複雑性トラッキング

> 憲章違反の正当化が必要な場合のみ記入

該当なし — 全原則に準拠。

## 実装戦略

### フェーズ構成

1. **Phase 1: セットアップ** — テストディレクトリ作成、チェックアウト・注文完了ページのルート作成
2. **Phase 2: 基盤** — ドメイン API ユースケース実装（4 関数）、単体テスト、統合テスト
3. **Phase 3: US1 チェックアウトと注文確定** — カートページにボタン追加、チェックアウト画面、注文完了画面
4. **Phase 4: US2 購入者の注文履歴・詳細** — OrderList, OrderDetail の UI 実装、注文履歴リンク有効化
5. **Phase 5: US3 管理者の注文一覧** — AdminOrderList の UI 実装、ステータス絞り込み、注文管理リンク有効化
6. **Phase 6: US4 管理者のステータス更新** — AdminOrderDetail のステータス更新 UI
7. **Phase 7: E2E テスト** — 購入者導線・管理者導線の E2E テスト
8. **Phase 8: ポリッシュ** — TypeScript/ESLint チェック、カバレッジ確認

### 主要設計決定

- **ステータス遷移**: `src/contracts/orders.ts` の `ValidStatusTransitions` をステートマシンとして使用。ドメイン層とUI層の両方で参照し、無効な遷移を事前に防止する
- **チェックアウトフロー**: カート → `/checkout`（確認画面）→ POST /api/orders → `/order-complete`（完了画面）の 3 ステップ
- **注文金額**: カートの `subtotal`（税抜小計）をそのまま `totalAmount` として使用
- **カートクリア**: 注文作成成功後に `cartFetcher.clear()` を呼び出し、`cart-updated` イベントを発火してヘッダーのカート件数を更新
- **購入者/管理者の UI 分離**: `src/domains/orders/ui/index.tsx`（購入者向け）と `src/domains/orders/ui/admin.tsx`（管理者向け）に分離
