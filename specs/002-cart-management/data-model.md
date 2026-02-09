# データモデル: カート管理機能

## エンティティ

### カート（Cart）

購入者ごとに1つ存在する買い物かご。

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| id | UUID | 必須、一意 | カートID |
| userId | UUID | 必須 | 購入者ID |
| items | CartItem[] | 必須 | カート内商品リスト |
| subtotal | 整数 | >= 0 | 商品合計金額（税抜） |
| itemCount | 整数 | >= 0 | items の quantity 合計 |
| createdAt | 日時 | 必須 | 作成日時 |
| updatedAt | 日時 | 必須 | 更新日時 |

**既存契約**: `src/contracts/cart.ts` の `CartSchema` に定義済み

### カートアイテム（CartItem）

カート内の1商品。同一商品は1つのアイテムに集約される。

| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| productId | UUID | 必須 | 商品ID |
| productName | 文字列 | 必須 | 商品名（追加時点のスナップショット） |
| price | 整数 | >= 0 | 単価（追加時点のスナップショット） |
| imageUrl | URL文字列 | 任意 | 商品画像URL |
| quantity | 整数 | 1〜99 | 数量 |
| addedAt | 日時 | 必須 | 追加日時 |

**既存契約**: `src/contracts/cart.ts` の `CartItemSchema` に定義済み

### 商品（Product）— 参照のみ

カタログ機能（001-catalog-listing）で管理される既存エンティティ。カート操作時に在庫チェックで参照する。

| フィールド | 型 | カートでの利用 |
|-----------|-----|---------------|
| id | UUID | カートアイテムの productId と紐付け |
| name | 文字列 | カート追加時に productName にコピー |
| price | 整数 | カート追加時に price にコピー |
| stock | 整数 | 在庫チェック（追加時・数量変更時） |
| imageUrl | URL文字列 | カート追加時に imageUrl にコピー |

**既存契約**: `src/contracts/catalog.ts` の `ProductSchema` に定義済み

## エンティティ関係

```
購入者 (userId) ─── 1:1 ──→ Cart
Cart ─── 1:N ──→ CartItem
CartItem ─── N:1 ──→ Product (参照のみ)
```

## バリデーションルール

| ルール | 対象操作 | 条件 |
|--------|---------|------|
| 数量範囲 | 追加・更新 | 1 <= quantity <= 99 |
| 在庫チェック | 追加・更新 | quantity <= product.stock |
| 商品存在確認 | 追加 | productId が有効な published 商品 |
| カートアイテム存在確認 | 更新・削除 | productId がカート内に存在 |
| 認証チェック | 全操作 | buyer ロールが必要 |

## 計算ルール

| 項目 | 計算式 |
|------|--------|
| 小計（CartItem） | price × quantity |
| 商品合計（subtotal） | Σ(各アイテムの小計) |
| 商品数（itemCount） | Σ(各アイテムの quantity) |
| 消費税 | Math.floor(subtotal × 0.1) |
| 総合計 | subtotal + 消費税 |

## 契約変更

### `src/contracts/cart.ts` — `ProductFetcher` インターフェース

`stock` フィールドを返り値に追加する:

```
変更前: findById() → { id, name, price, imageUrl? } | null
変更後: findById() → { id, name, price, imageUrl?, stock } | null
```

これにより、ドメインAPIレイヤーで在庫チェックが可能になる。
