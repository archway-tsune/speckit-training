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

本テンプレートでは、本番コードとサンプル実装を分離しています：

```
src/app/        → @/domains/ をインポート
src/infrastructure/ → @/contracts/ をインポート（共有インターフェース）
src/samples/    → @/contracts/ をインポート（独立した参照コード）
```

### src/domains/ - 暫定スキャフォールド

`src/domains/` には暫定スキャフォールドが配置されており、初期状態では `@/samples/` を再エクスポートしています。
本番実装時にはこの再エクスポートを独自の実装に置き換えてください。

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

サンプルは独立した参照コードです。本番実装は `src/domains/` に作成してください。

### 本番実装への移行

```bash
# 1. src/domains/{domain}/api/index.ts の再エクスポートを独自実装に置換
# 2. src/domains/{domain}/ui/index.ts の再エクスポートを独自実装に置換
# 3. 不要になったら src/samples/ を削除 → rm -rf src/samples/
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
