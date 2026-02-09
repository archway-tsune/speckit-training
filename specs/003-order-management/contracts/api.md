# API 契約: 注文機能

**作成日**: 2026-02-09
**ブランチ**: `003-order-management`
**契約定義**: `src/contracts/orders.ts`（既存）

## エンドポイント一覧

### 購入者向け

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | /api/orders | 注文一覧取得 | buyer 必須 |
| GET | /api/orders/:id | 注文詳細取得 | buyer 必須（自分の注文のみ） |
| POST | /api/orders | 注文作成（チェックアウト） | buyer 必須 |

### 管理者向け

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | /api/orders | 全注文一覧取得 | admin 必須 |
| GET | /api/orders/:id | 注文詳細取得 | admin 必須 |
| PATCH | /api/orders/:id/status | ステータス更新 | admin 必須 |

---

## GET /api/orders

注文一覧を取得する。購入者は自分の注文のみ、管理者は全注文を取得できる。

**クエリパラメータ**:

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| page | number | 1 | ページ番号 |
| limit | number | 20 | 1 ページあたりの件数 |
| status | OrderStatus | - | ステータスで絞り込み（任意） |

**成功レスポンス** (200):

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "userId": "user-id",
        "items": [...],
        "totalAmount": 5000,
        "status": "pending",
        "createdAt": "2026-02-09T00:00:00Z",
        "updatedAt": "2026-02-09T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

**エラーレスポンス**: 401（未認証）

---

## GET /api/orders/:id

注文詳細を取得する。購入者は自分の注文のみアクセス可能。

**パスパラメータ**: `id` — 注文 ID（UUID）

**成功レスポンス** (200):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-id",
    "items": [
      {
        "productId": "product-uuid",
        "productName": "商品名",
        "price": 1000,
        "quantity": 2
      }
    ],
    "totalAmount": 2000,
    "status": "pending",
    "createdAt": "2026-02-09T00:00:00Z",
    "updatedAt": "2026-02-09T00:00:00Z"
  }
}
```

**エラーレスポンス**: 401（未認証）、403（他人の注文）、404（存在しない）

---

## POST /api/orders

カート内容から注文を作成する。注文作成後、カートは自動クリアされる。

**リクエストボディ**:

```json
{
  "confirmed": true
}
```

**成功レスポンス** (201):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-id",
    "items": [...],
    "totalAmount": 5000,
    "status": "pending",
    "createdAt": "2026-02-09T00:00:00Z",
    "updatedAt": "2026-02-09T00:00:00Z"
  }
}
```

**エラーレスポンス**: 400（カートが空 / バリデーションエラー）、401（未認証）

---

## PATCH /api/orders/:id/status

注文ステータスを更新する（管理者のみ）。

**パスパラメータ**: `id` — 注文 ID（UUID）

**リクエストボディ**:

```json
{
  "status": "confirmed"
}
```

**成功レスポンス** (200):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "confirmed",
    "updatedAt": "2026-02-09T00:00:01Z"
  }
}
```

**エラーレスポンス**: 400（無効なステータス遷移）、401（未認証）、403（admin 以外）、404（存在しない）

### ステータス遷移ルール

| 現在 | 遷移可能先 |
|------|-----------|
| pending | confirmed, cancelled |
| confirmed | shipped, cancelled |
| shipped | delivered |
| delivered | （不可） |
| cancelled | （不可） |
