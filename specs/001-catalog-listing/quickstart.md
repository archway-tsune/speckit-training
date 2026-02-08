# クイックスタート: 商品カタログ閲覧

**ブランチ**: `001-catalog-listing`
**作成日**: 2026-02-08

## 前提条件

- Node.js 18以上
- npm インストール済み

## セットアップ

```bash
npm install
```

## 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000/catalog でカタログ閲覧ページにアクセス。

## テスト実行

```bash
# 単体テスト
npx vitest run

# 特定テストファイル
npx vitest run tests/unit/domains/catalog/

# 統合テスト
npx vitest run tests/integration/domains/catalog/

# E2Eテスト
npx playwright test tests/e2e/catalog/

# カバレッジ付き
npx vitest run --coverage
```

## 主要ファイル

| 種別 | パス | 説明 |
|------|------|------|
| コントラクト | `src/contracts/catalog.ts` | DTO・スキーマ定義 |
| ドメインAPI | `src/domains/catalog/api/` | ユースケース |
| ドメインUI | `src/domains/catalog/ui/` | UIコンポーネント |
| ドメイン型 | `src/domains/catalog/types/` | ドメイン固有型 |
| リポジトリ | `src/infrastructure/repositories/product.ts` | インメモリ商品データ |
| APIルート | `src/app/api/catalog/products/route.ts` | 一覧・登録API |
| APIルート | `src/app/api/catalog/products/[id]/route.ts` | 詳細・更新・削除API |
| 一覧ページ | `src/app/(buyer)/catalog/page.tsx` | 商品一覧ページ |
| 詳細ページ | `src/app/(buyer)/catalog/[id]/page.tsx` | 商品詳細ページ |
| レイアウト | `src/app/(buyer)/layout.tsx` | 購入者レイアウト（navLinks） |

## 実装フロー

1. **コントラクト拡張**: stock・keyword フィールド追加
2. **リポジトリ更新**: 検索・在庫対応
3. **ドメインAPI実装**: ユースケースの本番実装
4. **ドメインUI実装**: 在庫表示・検索バー付きコンポーネント
5. **ページ更新**: App Router ページの更新
6. **ナビゲーション追加**: 購入者レイアウトのリンク追加

各ステップでテストファースト（Red → Green → Refactor）を徹底する。
