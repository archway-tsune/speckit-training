# Speckit連携ガイド

このアーキテクチャテンプレートをspeckitで使用する方法を説明します。

## 関連ドキュメント

- [GETTING_STARTED.md](./GETTING_STARTED.md) - セットアップ手順
- [constitution-example.md](./examples/constitution-example.md) - `/speckit.constitution` の入力例
- [spec-template.md](./examples/spec-template.md) - 機能仕様のテンプレート例

---

## 1. セットアップフロー

```
1. git clone <your-repo-url>               # GitHubリポジトリをクローン
2. cd <your-repo>                          # リポジトリのルートに移動
3. specify init --here --ai claude         # speckit設定を初期化
4. ec-site-arch.zip 解凍                    # アーキテクチャコードを展開
5. /speckit.constitution                   # プロジェクト憲法を作成（セットアップ手順を含む）
6. 開発開始
```

### ディレクトリ構成

```
リポジトリのルート/
├── .claude/
│   └── commands/           ← specify init で作成（スキル定義）
│       ├── speckit.specify.md
│       ├── speckit.plan.md
│       ├── speckit.tasks.md
│       ├── speckit.implement.md
│       └── ...
│
├── .specify/               ← specify init で作成
│   ├── memory/
│   │   └── constitution.md ← /speckit.constitution で作成
│   └── templates/
│
├── src/                    ← zip から展開
│   ├── foundation/         # 共通基盤（認証・エラー・ログ・バリデーション）
│   ├── templates/          # 再利用テンプレート（UI・API・インフラ・テスト）
│   ├── contracts/          # 共有インターフェース（DTO・リポジトリ契約）
│   ├── domains/            # ドメイン実装（NotImplementedError スタブ → 本番置換）
│   │   ├── catalog/        #   api/index.ts（スタブ）, ui/index.tsx（プレースホルダー）
│   │   ├── cart/           #   同上
│   │   └── orders/         #   同上
│   ├── samples/            # サンプル実装（独立した参照コード）
│   │   ├── domains/        #   catalog, cart, orders のサンプル実装
│   │   └── tests/          #   サンプルテスト（unit, integration, e2e）
│   ├── infrastructure/     # インフラ層（@/contracts/ に依存）
│   │   ├── auth/           #   セッション管理
│   │   └── repositories/   #   リポジトリ実装（cart, order, product）
│   └── app/                # Next.js App Router
│       ├── (buyer)/        #   購入者画面（@/domains/ に依存、スタブ状態）
│       ├── admin/          #   管理者画面（@/domains/ に依存、スタブ状態）
│       ├── api/            #   本番 API Routes（@/domains/ に依存、501 応答）
│       ├── (samples)/      #   サンプル画面・API（@/samples/ に依存）
│       │   └── sample/     #     /sample/* URL でアクセス
│       ├── login/          #   ログイン画面（基盤機能）
│       ├── page.tsx        #   ホームページ（スタブ状態）
│       ├── layout.tsx      #   ルートレイアウト
│       └── middleware.ts   #   認証ミドルウェア
│
├── tests/                  ← zip から展開
│   ├── e2e/                #   本番 E2Eテスト（Playwright）
│   ├── integration/        #   統合テスト（domains, foundation, templates）
│   └── unit/               #   単体テスト（domains, foundation, templates）
│
├── docs/                   ← zip から展開
└── package.json            ← zip から展開
```

---

## 2. 開発ワークフロー

### 新機能を追加する場合

```bash
# 1. 機能仕様を作成
/speckit.specify "ユーザープロフィール機能を追加"

# 2. 実装計画を作成
/speckit.plan

# 3. タスクを生成
/speckit.tasks

# 4. 実装を開始
/speckit.implement
```

### 機能仕様の例

`/speckit.specify` を実行すると、以下のような仕様書が生成されます：

```markdown
# Feature: ユーザープロフィール

## 概要
ユーザーが自分のプロフィール情報を閲覧・編集できる機能

## ユーザーストーリー
- As a buyer, I want to view my profile, so that I can check my information
- As a buyer, I want to edit my profile, so that I can update my information

## 機能要件

### FR-001: プロフィール表示
- 説明: ログインユーザーが自分のプロフィールを閲覧できる
- 優先度: Must
- 関連UI: `src/domains/profile/ui/ProfileView.tsx`
- 関連API: `GET /api/profile`
```

---

## 3. アーキテクチャとの対応表

### テンプレート対応

| 要件タイプ | テンプレート | パス |
|-----------|-------------|------|
| 一覧画面 | ListPageTemplate | `@/templates/ui/pages/list` |
| 詳細画面 | DetailPageTemplate | `@/templates/ui/pages/detail` |
| フォーム画面 | FormPageTemplate | `@/templates/ui/pages/form` |
| ログイン画面 | LoginPageTemplate | `@/templates/ui/pages/login` |
| 購入者レイアウト | BuyerLayout | `@/templates/ui/layouts/BuyerLayout` |
| 管理者レイアウト | AdminLayout | `@/templates/ui/layouts/AdminLayout` |
| ユースケース | createUseCase | `@/templates/api/usecase` |
| APIハンドラ | createHandler | `@/templates/api/handler` |
| リポジトリ | createHmrSafeStore | `@/templates/infrastructure/repository` |

### 認証・認可

| 要件 | 実装 |
|-----|------|
| ログイン必須 | `requireAuth()` |
| 管理者のみ | `requireRole(request, 'admin')` |
| 購入者のみ | `requireRole(request, 'buyer')` |

---

## 4. タスク生成の指針

既存ドメイン（catalog, cart, orders）には本番ページ・API Routes が配置済みで、`@/domains/` のスタブを置換すれば動作します。
新規ドメインの場合はページ・API Routes の新規作成が必要です。

### 既存ドメインの置き換え例（catalog, cart, orders）

```markdown
# Tasks: カタログ閲覧機能

## フェーズ1: ドメイン実装

### Task 1-1: Catalogドメインスタブの置き換え
- [ ] T001 APIスタブを本番実装に置換 `src/domains/catalog/api/index.ts`（NotImplementedError → usecases）
- [ ] T002 [P] UIスタブを本番実装に置換 `src/domains/catalog/ui/index.tsx`（プレースホルダー → コンポーネント）
- [ ] T003 [P] ユースケースを実装 `src/domains/catalog/api/usecases.ts`
- [ ] T004 UIコンポーネントを実装 `src/domains/catalog/ui/ProductList.tsx` 等

### Task 1-2: インフラ・ナビゲーション
- [ ] T005 リポジトリを実装する `src/infrastructure/repositories/product.ts`（`@/contracts/` のインターフェースを実装）
- [ ] T006 購入者レイアウトの navLinks コメントを解除 `src/app/(buyer)/layout.tsx`

> **ポイント**: 本番ページ（`src/app/(buyer)/catalog/page.tsx` 等）と API Routes（`src/app/api/catalog/products/route.ts` 等）は
> 既に `@/domains/` をインポートしているため、スタブ置換後は自動的に動作します。

### Task 1-3: テスト実装
- [ ] T007 [P] 単体テストを実装する `tests/unit/domains/catalog/`
- [ ] T008 E2Eテストを実装する `tests/e2e/catalog.spec.ts`

> **注意**: 本番E2Eテストは `tests/e2e/` 直下に配置します。
> `src/samples/tests/e2e/` のサンプルテストは参照用として活用してください。
```

### 新規ドメインの追加例（profile 等）

```markdown
# Tasks: ユーザープロフィール

## フェーズ1: ドメイン実装

### Task 1-1: Profileドメイン新規実装
- [ ] T001 型定義を実装する `src/contracts/profile.ts`
- [ ] T002 [P] UIコンポーネントを実装する `src/domains/profile/ui/`
- [ ] T003 [P] APIユースケースを実装する `src/domains/profile/api/usecases.ts`
- [ ] T004 リポジトリを実装する `src/infrastructure/repositories/profile.ts`

### Task 1-2: ページ・APIルート新規作成
- [ ] T005 プロフィールページを作成 `src/app/(buyer)/profile/page.tsx`（`@/domains/profile/ui` をインポート）
- [ ] T006 編集ページを作成 `src/app/(buyer)/profile/edit/page.tsx`
- [ ] T007 [P] APIルートを作成 `src/app/api/profile/route.ts`（`@/domains/profile/api` をインポート）
- [ ] T008 購入者レイアウトの navLinks にリンクを追加 `src/app/(buyer)/layout.tsx`

### Task 1-3: テスト実装
- [ ] T009 [P] 単体テストを実装する `tests/unit/domains/profile/`
- [ ] T010 E2Eテストを実装する `tests/e2e/profile.spec.ts`
```

---

## 5. サンプル実装の参照

speckitで実装する際は、独立した参照コードであるサンプル実装を参考にしてください。
サンプルは `@/contracts/` のみに依存しており、本番コードから分離されています。

### Catalogドメイン（商品管理）
- 一覧・詳細表示
- 検索・フィルタ
- ページネーション

参照: `src/samples/domains/catalog/`

### Cartドメイン（カート）
- 商品追加・削除
- 数量変更
- 合計計算

参照: `src/samples/domains/cart/`

### Ordersドメイン（注文）
- 注文作成
- 注文履歴
- ステータス管理

参照: `src/samples/domains/orders/`

### 本番実装のパス

実装は `src/domains/` に配置します。既存ドメイン（catalog, cart, orders）の場合：

- **本番ページ**（`src/app/(buyer)/`, `src/app/admin/`）は配置済みで `@/domains/` をインポート
- **本番 API Routes**（`src/app/api/`）も配置済みで `@/domains/` をインポート（スタブ状態では 501 応答）
- **スタブ**（`src/domains/*/api/index.ts`, `src/domains/*/ui/index.tsx`）を本番実装に置き換えてください
- **レイアウト**の navLinks コメントを解除してナビゲーションを有効化してください

---

## 6. 品質基準

speckit仕様に以下の品質基準が適用されます：

### テスト
- 単体テストカバレッジ: 80%以上
- E2Eテスト: 主要導線をカバー（本番: `tests/e2e/` 直下、サンプル: `src/samples/tests/e2e/`）

### コード品質
- TypeScript: strictモード、エラー0件
- ESLint: エラー0件

### パフォーマンス
- 一覧ページ: 初回ロード 3秒以内
- API応答: 500ms以内

---

## 7. 憲法（constitution.md）について

`/speckit.constitution` を実行すると、プロジェクト固有の憲法が作成されます。

憲法には以下が含まれます：
- プロジェクト概要・技術スタック
- **アーキテクチャのセットアップ手順**（依存関係インストール、プロジェクト情報更新）
- アーキテクチャ原則
- 品質基準・テストコマンド
- ディレクトリ構成・命名規約
- 認証・認可パターン

憲法はspeckitの各コマンド（specify, plan, tasks, implement）で参照され、
一貫した実装を保証します。

入力例は `docs/examples/constitution-example.md` を参照してください。
