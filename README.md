# EC Site Architecture Template

ECサイト開発のためのアーキテクチャ基盤テンプレートです。
speckitと組み合わせてAI駆動開発を行うことを想定しています。

## 特徴

- **認証・認可基盤**: セッション管理、RBAC（buyer/admin）、CSRF対策
- **UIテンプレート**: レイアウト、フォーム、一覧・詳細・登録画面
- **APIテンプレート**: ユースケース、ハンドラー、DTO
- **テストテンプレート**: 単体・統合・E2Eテスト
- **品質ゲート**: TypeScript strict、ESLint、カバレッジ80%
- **speckit連携**: AI駆動開発のためのテンプレートと設定

## 技術スタック

- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3
- Zod (バリデーション)
- Vitest (単体・統合テスト)
- Playwright (E2Eテスト)

---

## クイックスタート

```bash
# 1. GitHubリポジトリをクローン
git clone <your-repo-url>
cd <your-repo>

# 2. speckit初期化（既存リポジトリ内で実行）
specify init --here --ai claude

# 3. アーキテクチャコードの展開（リリースZIPをリポジトリルートに解凍）
unzip ec-site-arch.zip -d .

# 4. プロジェクト憲法の作成（Claude Codeで実行）
/speckit.constitution
```

`/speckit.constitution` でプロジェクト固有の情報を入力すると、
セットアップ手順やアーキテクチャの使い方を含む憲法が作成されます。

詳細は `docs/examples/constitution-example.md` を参照してください。

---

## ディレクトリ構成

```
src/
├── foundation/          # 共通基盤（認証・エラー・ログ・バリデーション）
├── templates/           # 再利用テンプレート（UI・API・インフラ・テスト）
├── contracts/           # 共有インターフェース（DTO・リポジトリ契約）
├── domains/             # ドメイン実装（NotImplementedError スタブ → 本番実装に置換）
├── samples/             # サンプル実装（独立した参照コード）
│   ├── domains/         # ドメインサンプル（catalog, cart, orders）
│   └── tests/           # サンプルテスト（本番テストから分離）
│       ├── unit/        # サンプル単体テスト
│       ├── integration/ # サンプル統合テスト
│       └── e2e/         # サンプルE2Eテスト
├── infrastructure/      # インフラ層実装（@/contracts/ に依存）
└── app/                 # Next.js App Router
    ├── (buyer)/         # 購入者画面（@/domains/ に依存、スタブ状態）
    ├── admin/           # 管理者画面（@/domains/ に依存、スタブ状態）
    ├── api/             # 本番 API Routes（@/domains/ に依存、501 応答）
    ├── (samples)/sample/  # サンプル画面・API（@/samples/ に依存）
    ├── login/           # ログイン画面（基盤機能）
    ├── page.tsx         # ホームページ（スタブ状態）
    ├── layout.tsx       # ルートレイアウト
    └── middleware.ts    # 認証ミドルウェア

tests/
├── e2e/                 # 本番 E2Eテスト（Playwright）
├── integration/         # 統合テスト
│   ├── domains/         # ドメイン実装の統合テスト
│   ├── foundation/      # 共通基盤の統合テスト
│   └── templates/       # テンプレートの統合テスト
└── unit/                # 単体テスト
    ├── domains/         # ドメイン実装の単体テスト
    ├── foundation/      # 共通基盤の単体テスト
    └── templates/       # テンプレートの単体テスト
```

### 依存関係

```
本番:     src/app/(buyer)/, admin/, api/  ──→ @/domains/ （スタブ → 本番実装に置換）
サンプル: src/app/(samples)/sample/       ──→ @/samples/domains/ （独立した参照実装）
インフラ: src/infrastructure/             ──→ @/contracts/ （共有インターフェースのみ）
サンプル: src/samples/                    ──→ @/contracts/ （独立した参照コード）
```

- `src/app/(buyer)/` と `src/app/admin/` のページは `@/domains/` 経由でドメインロジックをインポートします
- `src/app/api/` の API Routes も `@/domains/` をインポートし、スタブ状態では 501 を返します
- `src/app/(samples)/sample/` のサンプル画面は `@/samples/domains/` を直接インポートします
- `src/infrastructure/` は `@/contracts/` の共有インターフェースのみに依存します
- `src/domains/` は NotImplementedError スタブです（`@/samples/` への依存はありません）。本番実装で置き換えてください

---

## 本番実装への移行

本番ページ・API Routes は既に配置済みです。`src/domains/` のスタブを置き換えるだけで動作します。

### 1. ドメインスタブの置き換え

```typescript
// 置き換え前（スタブ）: src/domains/catalog/api/index.ts
export function getProducts(..._args: unknown[]): never {
  throw new NotImplementedError('catalog', 'getProducts');
}

// 置き換え後（本番実装）: src/domains/catalog/api/index.ts
export { getProducts, getProductById, ... } from './usecases';
```

- API スタブ（`src/domains/*/api/index.ts`）: NotImplementedError → ユースケースに置換
- UI スタブ（`src/domains/*/ui/index.tsx`）: プレースホルダー → コンポーネントに置換

### 2. ナビゲーションの有効化

レイアウトの `navLinks` のコメントを解除します。

```typescript
// src/app/(buyer)/layout.tsx
const navLinks: NavLink[] = [
  { href: '/catalog', label: '商品一覧' },  // コメント解除
  { href: '/cart', label: 'カート' },        // コメント解除
  { href: '/orders', label: '注文履歴' },    // コメント解除
];
```

### 3. テストの配置

```
tests/e2e/           ← 本番 E2Eテスト
tests/unit/domains/  ← 本番 単体テスト
tests/integration/domains/ ← 本番 統合テスト
```

### 4. サンプルの削除（任意）

```bash
rm -rf src/samples/ src/app/\(samples\)/
```

詳細は [GETTING_STARTED.md](docs/GETTING_STARTED.md) を参照してください。

---

## 開発ワークフロー（speckit連携）

```bash
# 機能仕様を作成
/speckit.specify "ユーザー管理機能を追加"

# 実装計画を作成
/speckit.plan

# タスクを生成
/speckit.tasks

# 実装を開始
/speckit.implement
```

---

## ドキュメント

- [GETTING_STARTED.md](docs/GETTING_STARTED.md) - セットアップガイド
- [SPECKIT_INTEGRATION.md](docs/SPECKIT_INTEGRATION.md) - speckit連携ガイド
- [constitution-example.md](docs/examples/constitution-example.md) - 憲法の入力例

---

## ライセンス

MIT
