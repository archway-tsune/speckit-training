# クイックスタート: カタログ閲覧機能

**ブランチ**: `001-catalog-listing` | **日付**: 2026-02-09

## 前提条件

- Node.js 18+
- npm

## セットアップ

```bash
npm install
```

## 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000/catalog で商品一覧を確認。

## テスト実行

```bash
# 単体テスト
npx vitest run tests/unit/domains/catalog/

# 統合テスト
npx vitest run tests/integration/domains/catalog/

# E2E テスト
npx playwright test tests/e2e/catalog/
```

## 実装の流れ

### ステップ 1: 契約変更
1. `src/contracts/catalog.ts` に `stock` フィールドと `keyword` パラメータを追加
2. `src/infrastructure/repositories/product.ts` のサンプルデータに `stock` を追加
3. `src/samples/` 配下のモックデータを更新（ビルド破壊防止）

### ステップ 2: ドメイン API スタブ置換
1. `src/domains/catalog/api/index.ts` の NotImplementedError スタブを本番ユースケースに置換
2. `src/samples/domains/catalog/api/usecases.ts` を参考に実装
3. 検索機能（`keyword` パラメータ対応）を追加

### ステップ 3: ドメイン UI スタブ置換
1. `src/domains/catalog/ui/index.tsx` のプレースホルダーを本番コンポーネントに置換
2. `src/samples/domains/catalog/ui/` を参考に実装
3. 在庫表示（「在庫切れ」バッジ、在庫数表示）を追加
4. 検索バー統合

### ステップ 4: ナビゲーション有効化
1. `src/app/(buyer)/layout.tsx` の navLinks コメントを解除
2. `{ href: '/catalog', label: '商品一覧' }` のみ有効化（他はスコープ外）

### ステップ 5: 本番ページ更新
1. `src/app/(buyer)/catalog/page.tsx` にデータフェッチ・検索・ページネーション統合
2. `src/app/(buyer)/catalog/[id]/page.tsx` にデータフェッチ・在庫表示統合

## 主要ファイル一覧

| ファイル | 役割 |
|---------|------|
| `src/contracts/catalog.ts` | 商品スキーマ・API 契約定義 |
| `src/domains/catalog/api/index.ts` | 本番ドメイン API（ユースケース） |
| `src/domains/catalog/ui/index.tsx` | 本番ドメイン UI コンポーネント |
| `src/infrastructure/repositories/product.ts` | インメモリ商品リポジトリ |
| `src/app/(buyer)/catalog/page.tsx` | 商品一覧ページ |
| `src/app/(buyer)/catalog/[id]/page.tsx` | 商品詳細ページ |
| `src/app/api/catalog/products/route.ts` | 商品一覧 API Route |
| `src/app/api/catalog/products/[id]/route.ts` | 商品詳細 API Route |
| `src/app/(buyer)/layout.tsx` | 購入者レイアウト（ナビゲーション） |
