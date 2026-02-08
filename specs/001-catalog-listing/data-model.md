# データモデル: 商品カタログ閲覧

**ブランチ**: `001-catalog-listing`
**作成日**: 2026-02-08

## エンティティ

### 商品（Product）

カタログに表示される販売対象の商品。

| 属性 | 型 | 制約 | 説明 |
|------|------|------|------|
| id | UUID | 必須、一意 | 商品の識別子 |
| name | 文字列 | 必須、1〜200文字 | 商品名 |
| price | 整数 | 必須、0以上 | 価格（円） |
| description | 文字列 | 任意、最大2000文字 | 商品説明文 |
| imageUrl | 文字列（URL） | 任意 | 商品画像のURL |
| stock | 整数 | 必須、0以上、デフォルト0 | 在庫数（**新規追加**） |
| status | 列挙型 | 必須 | draft / published / archived |
| createdAt | 日時 | 必須 | 作成日時 |
| updatedAt | 日時 | 必須 | 更新日時 |

### 状態遷移

```
draft → published → archived
         ↑            |
         └────────────┘（再公開）
```

- `published` 商品のみ購入者に表示される
- `draft` / `archived` 商品は管理者のみ閲覧可能

### 在庫ルール

- `stock === 0`: 在庫切れ → カード上で「在庫切れ」表示、カート追加ボタン無効化
- `stock > 0`: 在庫あり → 通常表示、カート追加ボタン有効

## バリデーションルール

### 商品一覧取得入力

| パラメータ | 型 | デフォルト | 制約 | 説明 |
|-----------|------|----------|------|------|
| page | 整数 | 1 | 1以上 | ページ番号 |
| limit | 整数 | 20 | 1〜100 | 1ページあたりの件数 |
| status | 列挙型 | なし | draft/published/archived | ステータスフィルタ |
| keyword | 文字列 | なし | 最大200文字 | 検索キーワード（**新規追加**） |

### 検索ルール

- `keyword` が指定された場合、商品名（name）と説明文（description）の両方を対象に部分一致検索を行う
- 大文字・小文字を区別しない
- `keyword` が空文字または未指定の場合、フィルタなし（全商品を返す）
- 検索結果にもページネーションが適用される

## リポジトリインターフェース変更

### 変更前

```
findAll(params: { status?: ProductStatus; offset: number; limit: number }): Promise<Product[]>
count(status?: ProductStatus): Promise<number>
```

### 変更後

```
findAll(params: { status?: ProductStatus; keyword?: string; offset: number; limit: number }): Promise<Product[]>
count(filter?: { status?: ProductStatus; keyword?: string }): Promise<number>
```

**変更点**:
- `findAll` に `keyword` パラメータを追加
- `count` のパラメータを `filter` オブジェクトに統一（status と keyword を含む）
