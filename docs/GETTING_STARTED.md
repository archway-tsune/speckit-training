# Getting Started - セットアップガイド

EC Site Architecture Templateを使って新規プロジェクトを開始する手順です。

---

## 前提条件

- Node.js 18以上
- pnpm
- Claude Code（speckitコマンド実行用）

---

## セットアップ手順

### Step 1: GitHubリポジトリをクローン

```bash
git clone <your-repo-url>
cd <your-repo>
```

### Step 2: speckit初期化

既存リポジトリのルートディレクトリで実行します：

```bash
specify init --here --ai claude
```

これにより以下が作成されます：
- `.claude/commands/` - speckitスキル定義
- `.specify/` - speckit設定とテンプレート

### Step 3: アーキテクチャコードの展開

リリースZIPをリポジトリのルートディレクトリ直下に解凍します：

```bash
unzip ec-site-arch.zip -d .
```

### Step 4: プロジェクト憲法の作成

Claude Codeで以下を実行：

```
/speckit.constitution
```

対話形式でプロジェクト情報を入力すると、以下を含む憲法が作成されます：
- 依存関係のインストール手順
- プロジェクト情報の更新方法
- アーキテクチャの使い方
- 品質基準とテストコマンド

入力例は `docs/examples/constitution-example.md` を参照してください。

---

## 開発ワークフロー

### 新機能の追加

```bash
# 1. 機能仕様を作成
/speckit.specify "決済機能を追加"

# 2. 実装計画を作成
/speckit.plan

# 3. タスクを生成
/speckit.tasks

# 4. 実装を開始
/speckit.implement
```

---

## アーキテクチャの依存構造

本テンプレートでは、本番コードとサンプル実装を完全に分離しています：

```
本番ページ:   src/app/(buyer)/, admin/        → @/domains/ をインポート（スタブ → 本番実装に置換）
本番API:      src/app/api/                     → @/domains/ をインポート（スタブ状態では 501 応答）
サンプル画面: src/app/(samples)/sample/        → @/samples/domains/ を直接インポート
インフラ:     src/infrastructure/              → @/contracts/ をインポート（共有インターフェース）
サンプル:     src/samples/                     → @/contracts/ をインポート（独立した参照コード）
```

### src/domains/ - スタブ実装

`src/domains/` にはスタブ実装が配置されています。
API は `NotImplementedError` をスロー（本番 API Routes は 501 を返す）、UI は「ドメイン未実装」プレースホルダーを表示します。
`@/samples/` への依存はありません。本番実装で置き換えてください。

### src/contracts/ - 共有インターフェース

`src/contracts/` にはリポジトリインターフェース（ProductRepository, CartRepository, OrderRepository 等）と
DTO（Zodスキーマ）が定義されています。`src/infrastructure/` と `src/samples/` はこの契約のみに依存します。

### src/samples/ - 参照コード

`src/samples/domains/` に以下のサンプル実装があります：

| ドメイン | 機能 |
|---------|------|
| Catalog | 商品一覧・詳細、検索・フィルタ |
| Cart | 商品追加・削除、数量変更 |
| Orders | 注文作成、注文履歴 |

サンプルは独立した参照コードです。サンプル画面は `/sample/` URL配下（`src/app/(samples)/sample/`）でアクセスできます。

### 本番実装への移行

本番ページ（`src/app/(buyer)/`, `src/app/admin/`）と API Routes（`src/app/api/`）は既に配置済みです。
`src/domains/` のスタブを置き換えるだけでページと API が動作します。

#### Step 1: ドメイン API の置き換え

`src/domains/{domain}/api/index.ts` の NotImplementedError スタブをユースケース実装に置換します。

```typescript
// 置き換え前（スタブ）
export function getProducts(..._args: unknown[]): never {
  throw new NotImplementedError('catalog', 'getProducts');
}

// 置き換え後（本番実装）
export { getProducts, getProductById, createProduct, ... } from './usecases';
```

本番 API Routes（`src/app/api/catalog/products/route.ts` 等）は `@/domains/` をインポートしているため、
スタブ置換後は自動的に 501 応答から正常応答に変わります。

#### Step 2: ドメイン UI の置き換え

`src/domains/{domain}/ui/index.tsx` の「ドメイン未実装」プレースホルダーを実コンポーネントに置換します。

```typescript
// 置き換え前（プレースホルダー）
export function ProductList() {
  return <div>ドメイン未実装</div>;
}

// 置き換え後（本番実装）
export { ProductList } from './ProductList';
export { ProductDetail } from './ProductDetail';
```

本番ページ（`src/app/(buyer)/catalog/page.tsx` 等）は `@/domains/` の UI をインポートしているため、
スタブ置換後は自動的にプレースホルダーから実画面に変わります。

#### Step 3: ナビゲーションの有効化

レイアウトファイルの `navLinks` のコメントを解除して、ドメインのナビゲーションリンクを追加します。

- 購入者: `src/app/(buyer)/layout.tsx` の `navLinks`（例: `{ href: '/catalog', label: '商品一覧' }`）
- 管理者: `src/app/admin/layout.tsx` の `navLinks`（例: `{ href: '/admin/products', label: '商品管理' }`）

#### Step 4: テストの配置

本番テストは `tests/` 配下に配置します（サンプルテストの `src/samples/tests/` とは分離）。

```
tests/e2e/                  ← 本番 E2Eテスト（pnpm test:e2e で実行）
tests/unit/domains/         ← 本番 単体テスト（pnpm test:unit で実行）
tests/integration/domains/  ← 本番 統合テスト（pnpm test:integration で実行）
```

E2Eテスト作成時は `src/samples/tests/e2e/domains/` のサンプルテストを参考にしてください。

#### Step 5: サンプルの削除（任意）

本番実装が完了したら、サンプルを安全に削除できます。

```bash
rm -rf src/samples/ src/app/\(samples\)/
```

---

## テスト

### テストコマンド

```bash
# 単体テスト
pnpm test:unit

# 統合テスト
pnpm test:integration

# E2Eテスト（ドメイン実装のテスト）
pnpm test:e2e
```

ドメイン実装のE2Eテストは `tests/e2e/` 直下に配置してください。
`tests/e2e/arch/` 以下のアーキテクチャ基盤用E2Eテストは `pnpm test:e2e` の実行対象から自動的に除外されます。

---

## 関連ドキュメント

- [SPECKIT_INTEGRATION.md](./SPECKIT_INTEGRATION.md) - speckit連携の詳細
- [constitution-example.md](./examples/constitution-example.md) - 憲法の入力例
- [spec-template.md](./examples/spec-template.md) - 機能仕様のテンプレート
