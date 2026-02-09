# API 契約: 商品管理機能

## 概要

管理者向け商品管理 API。全エンドポイントに admin ロールの認証が必要。
ベースパス: `/api/products`

---

## エンドポイント

### GET /api/products — 商品一覧取得（管理者用）

**認証**: admin 必須

**クエリパラメータ**:

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|------|------|-----------|------|
| page | number | × | 1 | ページ番号 |
| limit | number | × | 20 | 1ページあたり件数 |
| status | string | × | - | ステータスフィルタ（draft/published/archived） |

**レスポンス（200）**:
```json
{
  "success": true,
  "data": {
    "products": [Product],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 14,
      "totalPages": 1
    }
  }
}
```

---

### GET /api/products/:id — 商品詳細取得（管理者用）

**認証**: admin 必須

**パスパラメータ**: `id` — 商品 UUID

**レスポンス（200）**:
```json
{
  "success": true,
  "data": Product
}
```

**エラー（404）**: 商品が見つからない場合

---

### POST /api/products — 商品登録

**認証**: admin 必須

**リクエストボディ**:
```json
{
  "name": "テスト商品",
  "price": 1500,
  "stock": 10,
  "description": "説明文",
  "imageUrl": "https://example.com/image.jpg"
}
```

**レスポンス（201）**:
```json
{
  "success": true,
  "data": Product
}
```

**エラー（400）**: バリデーションエラー
**エラー（403）**: admin 以外のアクセス

---

### PUT /api/products/:id — 商品更新

**認証**: admin 必須

**パスパラメータ**: `id` — 商品 UUID

**リクエストボディ**（部分更新対応）:
```json
{
  "name": "更新された商品名",
  "price": 2000
}
```

**レスポンス（200）**:
```json
{
  "success": true,
  "data": Product
}
```

**エラー（400）**: バリデーションエラー
**エラー（403）**: admin 以外のアクセス
**エラー（404）**: 商品が見つからない場合

---

### PATCH /api/products/:id/status — ステータス変更

**認証**: admin 必須

**パスパラメータ**: `id` — 商品 UUID

**リクエストボディ**:
```json
{
  "status": "published"
}
```

**レスポンス（200）**:
```json
{
  "success": true,
  "data": Product
}
```

**エラー（400）**: 無効なステータス値
**エラー（403）**: admin 以外のアクセス
**エラー（404）**: 商品が見つからない場合

---

### DELETE /api/products/:id — 商品削除

**認証**: admin 必須

**パスパラメータ**: `id` — 商品 UUID

**レスポンス（200）**:
```json
{
  "success": true,
  "data": { "success": true }
}
```

**エラー（403）**: admin 以外のアクセス
**エラー（404）**: 商品が見つからない場合

---

## CQRS 分離

| API パス | ドメイン | 責務 | HTTPメソッド |
|----------|---------|------|-------------|
| `/api/catalog/products` | catalog | 購入者向け閲覧（読み取り専用） | GET |
| `/api/catalog/products/:id` | catalog | 購入者向け詳細（読み取り専用） | GET |
| `/api/products` | product | 管理者向け一覧・登録 | GET, POST |
| `/api/products/:id` | product | 管理者向け詳細・更新・削除 | GET, PUT, DELETE |
| `/api/products/:id/status` | product | ステータス変更 | PATCH |

## 既存 catalog API の変更

`/api/catalog/products/route.ts` から POST ハンドラを削除し、GET のみ残す。
`/api/catalog/products/[id]/route.ts` から PUT/DELETE ハンドラを削除し、GET のみ残す。
