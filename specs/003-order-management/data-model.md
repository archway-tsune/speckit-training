# データモデル: 注文機能

**作成日**: 2026-02-09
**ブランチ**: `003-order-management`

## エンティティ

### 注文（Order）

| フィールド | 型 | 説明 | バリデーション |
|-----------|-----|------|---------------|
| id | UUID (string) | 注文 ID | 自動生成 |
| userId | string | 購入者 ID | 必須 |
| items | OrderItem[] | 注文明細のリスト | 1 件以上 |
| totalAmount | number | 合計金額（税抜） | 0 以上 |
| status | OrderStatus | 注文ステータス | 初期値: pending |
| createdAt | string (ISO 8601) | 注文日時 | 自動生成 |
| updatedAt | string (ISO 8601) | 更新日時 | 自動更新 |

### 注文明細（OrderItem）

| フィールド | 型 | 説明 | バリデーション |
|-----------|-----|------|---------------|
| productId | string | 商品 ID | 必須 |
| productName | string | 商品名 | 必須 |
| price | number | 単価 | 0 以上 |
| quantity | number | 数量 | 1 以上 |

**注**: 小計は `price × quantity` で算出（格納フィールドなし）。

### 注文ステータス（OrderStatus）

| 値 | 日本語表示 | 説明 |
|----|-----------|------|
| pending | 保留中 | 初期ステータス |
| confirmed | 確認済み | 管理者が確認 |
| shipped | 発送済み | 発送完了 |
| delivered | 配送完了 | 配送完了（最終状態） |
| cancelled | キャンセル | キャンセル（最終状態） |

## ステータス遷移ルール（ステートマシン）

```text
pending ──→ confirmed ──→ shipped ──→ delivered (最終)
  │              │
  └──→ cancelled ←┘                   cancelled (最終)
```

| 現在のステータス | 遷移可能先 |
|----------------|-----------|
| pending | confirmed, cancelled |
| confirmed | shipped, cancelled |
| shipped | delivered |
| delivered | （遷移不可） |
| cancelled | （遷移不可） |

**実装**: `src/contracts/orders.ts` の `ValidStatusTransitions` で定義済み。

## リレーション

```text
Order (1) ──→ (N) OrderItem
  │
  └── userId ──→ User（セッションから取得、直接参照なし）
```

- 注文と注文明細は 1:N の関係
- 注文の `userId` はセッションの `userId` と対応（ユーザーエンティティへの直接参照はない）
- カートから注文への変換: `CartItem` → `OrderItem`（`imageUrl` と `addedAt` を除外）

## ストレージ

- **インメモリ**: `globalThis.__orderStore`（`Map<string, Order>`）
- **リポジトリ**: `src/infrastructure/repositories/order.ts`（実装済み）
- **カート連携**: `CartFetcher` インターフェース経由でカートを取得・クリア
