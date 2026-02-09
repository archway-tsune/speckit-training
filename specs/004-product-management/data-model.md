# データモデル: 商品管理機能

## エンティティ

### Product（商品）

管理者が管理する商品データ。catalog ドメインと product ドメインで共有されるエンティティ。

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|------|------|------|------|
| id | UUID (string) | ○ | 自動採番 | 商品の一意識別子 |
| name | string | ○ | 1〜200文字 | 商品名 |
| price | integer | ○ | 0以上 | 税抜価格（整数） |
| stock | integer | ○ | 0以上、デフォルト0 | 在庫数 |
| description | string | × | 最大2000文字 | 商品説明 |
| imageUrl | string | × | 有効なURL形式 | 商品画像URL |
| status | ProductStatus | ○ | 列挙型 | 商品ステータス |
| createdAt | Date | ○ | 自動設定 | 作成日時 |
| updatedAt | Date | ○ | 自動設定 | 更新日時 |

### ProductStatus（商品ステータス）

| 値 | 表示名 | 説明 |
|-----|--------|------|
| draft | 下書き | 新規登録時のデフォルト。購入者に非表示 |
| published | 公開中 | 購入者に表示される。カタログに掲載 |
| archived | アーカイブ | 購入者に非表示。販売終了等で使用 |

### ステータス遷移

全ステータス間の遷移が可能（制限なし）。

```
draft ↔ published ↔ archived
  ↕                    ↕
  └────────────────────┘
```

## バリデーションルール

### 商品登録（CreateProduct）

| フィールド | ルール |
|-----------|--------|
| name | 必須、1〜200文字 |
| price | 必須、0以上の整数 |
| stock | 任意、0以上の整数（デフォルト0） |
| description | 任意、最大2000文字 |
| imageUrl | 任意、有効なURL形式 |
| status | デフォルト `draft` |

### 商品更新（UpdateProduct）

| フィールド | ルール |
|-----------|--------|
| id | 必須、UUID |
| name | 任意、1〜200文字 |
| price | 任意、0以上の整数 |
| stock | 任意、0以上の整数 |
| description | 任意、最大2000文字 |
| imageUrl | 任意、有効なURL形式 |
| status | 任意、ProductStatus |

### 商品削除（DeleteProduct）

| フィールド | ルール |
|-----------|--------|
| id | 必須、UUID |

## リポジトリインターフェース

`ProductRepository` は `src/contracts/catalog.ts` に定義済み。catalog（読み取り）と product（書き込み）の両ドメインで共有する。

### メソッド

| メソッド | 説明 | 使用ドメイン |
|----------|------|-------------|
| findAll | ステータス・キーワード・ページネーション付き一覧取得 | catalog, product |
| findById | ID指定で1件取得 | catalog, product |
| count | 条件付き件数取得 | catalog, product |
| create | 新規商品作成 | product のみ |
| update | 商品情報の部分更新 | product のみ |
| delete | 商品削除 | product のみ |
