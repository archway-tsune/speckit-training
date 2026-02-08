# コントラクト変更仕様: 商品カタログ閲覧

**ブランチ**: `001-catalog-listing`
**作成日**: 2026-02-08
**対象ファイル**: `src/contracts/catalog.ts`

## 変更概要

商品カタログ閲覧機能の実装に伴い、以下のコントラクト変更が必要。

## 1. ProductSchema への stock フィールド追加

```
変更前:
  id, name, price, description, imageUrl, status, createdAt, updatedAt

変更後:
  id, name, price, description, imageUrl, stock, status, createdAt, updatedAt
```

- `stock`: `z.number().int().min(0).default(0)` — 在庫数（0以上の整数、デフォルト0）

## 2. GetProductsInputSchema への keyword フィールド追加

```
変更前:
  page, limit, status

変更後:
  page, limit, status, keyword
```

- `keyword`: `z.string().max(200).optional()` — 検索キーワード（任意、最大200文字）

## 3. CreateProductInputSchema への stock フィールド追加

```
変更前:
  name, price, description, imageUrl, status

変更後:
  name, price, description, imageUrl, stock, status
```

- `stock`: `z.number().int().min(0, '在庫数は0以上で入力してください').default(0)`

## 4. UpdateProductInputSchema への stock フィールド追加

```
変更前:
  id, name, price, description, imageUrl, status

変更後:
  id, name, price, description, imageUrl, stock, status
```

- `stock`: `z.number().int().min(0).optional()`

## 5. ProductRepository インターフェース変更

### findAll

```
変更前:
  findAll(params: { status?: ProductStatus; offset: number; limit: number })

変更後:
  findAll(params: { status?: ProductStatus; keyword?: string; offset: number; limit: number })
```

### count

```
変更前:
  count(status?: ProductStatus)

変更後:
  count(filter?: { status?: ProductStatus; keyword?: string })
```

## API エンドポイント

### GET /api/catalog/products

**クエリパラメータ追加**:
- `keyword` (string, optional): 商品名・説明文の検索キーワード

**レスポンス変更**:
- 商品オブジェクトに `stock` フィールドが追加される

### GET /api/catalog/products/:id

**レスポンス変更**:
- 商品オブジェクトに `stock` フィールドが追加される
