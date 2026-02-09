# データモデル: カタログ閲覧機能

**ブランチ**: `001-catalog-listing` | **日付**: 2026-02-09

## エンティティ

### 商品（Product）

商品カタログの中核エンティティ。購入者が閲覧・検索する対象。

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | UUID | Yes | 商品の一意識別子 |
| name | string (1-200文字) | Yes | 商品名 |
| price | integer (>= 0) | Yes | 価格（円） |
| stock | integer (>= 0) | Yes | 在庫数（**新規追加**） |
| description | string (最大2000文字) | No | 商品説明文 |
| imageUrl | string (URL形式) | No | 商品画像URL |
| status | enum: draft/published/archived | Yes | 公開ステータス |
| createdAt | Date | Yes | 作成日時 |
| updatedAt | Date | Yes | 更新日時 |

### ビジネスルール

- `stock === 0` の場合:
  - 一覧画面: 「在庫切れ」バッジを表示
  - 詳細画面: カート追加ボタンを無効化（`disabled`）
- `imageUrl` が未設定の場合: プレースホルダー画像を表示
- 購入者は `status === 'published'` の商品のみ閲覧可能
- 検索は `name` と `description` の部分一致（大文字小文字区別なし）

## API コントラクト変更

### 変更点: `ProductSchema` に `stock` 追加

```
既存:
  ProductSchema = { id, name, price, description, imageUrl, status, createdAt, updatedAt }

変更後:
  ProductSchema = { id, name, price, stock, description, imageUrl, status, createdAt, updatedAt }
```

### 変更点: `GetProductsInputSchema` に `keyword` 追加

```
既存:
  GetProductsInputSchema = { page, limit, status }

変更後:
  GetProductsInputSchema = { page, limit, status, keyword }
```

### 変更点: `CreateProductInputSchema` に `stock` 追加

```
既存:
  CreateProductInputSchema = { name, price, description, imageUrl, status }

変更後:
  CreateProductInputSchema = { name, price, stock, description, imageUrl, status }
```

### 変更点: `UpdateProductInputSchema` に `stock` 追加

```
既存:
  UpdateProductInputSchema = { id, name, price, description, imageUrl, status }

変更後:
  UpdateProductInputSchema = { id, name, price, stock, description, imageUrl, status }
```

## リポジトリインターフェース変更

### `findAll` パラメータに `keyword` 追加

```
既存:
  findAll(params: { status?, offset, limit }): Promise<Product[]>
  count(status?): Promise<number>

変更後:
  findAll(params: { status?, offset, limit, keyword? }): Promise<Product[]>
  count(status?, keyword?): Promise<number>
```

## サンプルデータへの影響

`src/infrastructure/repositories/product.ts` のサンプル商品データに `stock` フィールドを追加する:

| 商品名 | stock |
|--------|-------|
| E2Eテスト商品 | 10 |
| ミニマルTシャツ | 25 |
| レザーウォレット | 8 |
| キャンバストートバッグ | 0（在庫切れ） |
| ウールニット | 15 |
| デニムパンツ | 20 |

- 「キャンバストートバッグ」を在庫0とし、在庫切れ表示のテストに使用
