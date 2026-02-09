# サンプル実装（独立した参照コード）

このディレクトリには、アーキテクチャの動作検証用サンプル実装が含まれています。
サンプルは `@/contracts/` のみに依存する**独立した参照コード**であり、本番コードから分離されています。

## 目的

- アーキテクチャテンプレートの適用例を示す
- サンプルテスト（単体・統合・E2E）の実行環境を提供する
- 新規ドメイン実装時の参考コードとして利用する

## 依存関係

```
src/samples/ ──→ @/contracts/  （共有インターフェースのみ）
src/samples/ ──→ @/templates/  （テンプレート）
src/samples/ ──→ @/foundation/ （共通基盤）
```

- サンプルは `@/contracts/` の共有インターフェース（DTO・リポジトリ契約）のみに依存します
- 本番 `src/app/` や `src/infrastructure/` からサンプルを直接インポートしません
- サンプル画面は `src/app/(samples)/sample/` に配置され、`/sample/` URLプレフィックスでアクセスします
- `src/domains/` はスタブ実装（NotImplementedError）であり、`@/samples/` への依存はありません

## ディレクトリ構成

```
src/samples/
├── domains/          # ドメインサンプル実装
│   ├── catalog/      # 商品カタログ
│   │   ├── api/      # ユースケース
│   │   └── ui/       # UIコンポーネント
│   ├── cart/         # ショッピングカート
│   │   ├── api/
│   │   └── ui/
│   └── orders/       # 注文管理
│       ├── api/
│       └── ui/
└── tests/            # サンプルテスト（本番テストから分離）
    ├── unit/         # 単体テスト
    │   └── domains/
    ├── integration/  # 統合テスト
    │   └── domains/
    └── e2e/          # E2Eテスト（Playwright、/sample/ パス対象）
        └── domains/

src/app/(samples)/sample/   # サンプル画面（/sample/ URLプレフィックス）
├── page.tsx               # サンプルホーム
├── login/page.tsx         # サンプルログイン
├── (buyer)/               # 購入者画面
│   ├── layout.tsx
│   ├── catalog/           # /sample/catalog
│   ├── cart/              # /sample/cart
│   ├── checkout/          # /sample/checkout
│   └── orders/            # /sample/orders
├── admin/                 # 管理者画面
│   ├── layout.tsx
│   ├── login/page.tsx     # /sample/admin/login
│   ├── products/          # /sample/admin/products
│   └── orders/            # /sample/admin/orders
└── api/                   # サンプルAPI Routes（/sample/api/）
    ├── auth/              # 認証API
    ├── test/reset/        # テストリセットAPI
    ├── catalog/products/  # カタログAPI
    ├── cart/              # カートAPI
    └── orders/            # 注文API
```

## 本番実装との関係

| ディレクトリ | 用途 | 依存先 |
|-------------|------|--------|
| `src/samples/domains/` | 独立した参照コード（このディレクトリ） | `@/contracts/` |
| `src/domains/` | 本番ドメイン実装（NotImplementedError スタブ → 本番置換） | `@/contracts/` |
| `src/contracts/` | 共有インターフェース | なし |
| `src/infrastructure/` | インフラ層実装 | `@/contracts/` |

## テスト実行コマンド

サンプルテストは専用のコマンドで実行します（本番テストとは分離されています）。

```bash
# サンプル単体テスト
pnpm test:unit:samples

# サンプル統合テスト
pnpm test:integration:samples

# サンプルE2Eテスト
pnpm test:e2e:samples
```

- 単体・統合テストは `vitest.samples.config.ts` で設定されています
- E2Eテストは `playwright.samples.config.ts` で設定されています
- `src/samples/` を削除すると、サンプルテストも自動的に除外されます

## サンプルの利用方法

1. **参照コードとして**: 新規ドメインを実装する際の参考
2. **テスト環境として**: サンプルテスト（`pnpm test:unit:samples` 等）でのデモデータ提供
3. **学習用として**: アーキテクチャパターンの理解

## ナビゲーション制御

本番実装では、レイアウトファイルの `navLinks` はデフォルトで空（購入者）またはダッシュボードのみ（管理者）です。
ドメイン実装時に、対応するレイアウトファイルにナビゲーションリンクを追加してください。

- 購入者: `src/app/(buyer)/layout.tsx` の `navLinks` にリンクを追加
- 管理者: `src/app/admin/layout.tsx` の `navLinks` にリンクを追加

サンプル実装環境では、サンプルドメインのレイアウトが全リンクを含むため、すべてのナビゲーションが表示されます。

## 注意事項

- サンプル実装は `@/contracts/` のみに依存する独立したコードです
- `src/app/` や `src/infrastructure/` からサンプルを直接インポートしないでください
- 本番実装は `src/domains/` の暫定スキャフォールドを置き換える形で作成してください
- サンプルが不要になった場合は `rm -rf src/samples/` で安全に削除できます
