# API コントラクト: カタログ閲覧機能

**ブランチ**: `001-catalog-listing` | **日付**: 2026-02-09

## エンドポイント一覧

| メソッド | パス | 認証 | 説明 | スコープ |
|---------|------|------|------|---------|
| GET | /api/catalog/products | 不要 | 商品一覧取得（検索・ページネーション含む） | 本機能 |
| GET | /api/catalog/products/:id | 不要 | 商品詳細取得 | 本機能 |
| POST | /api/catalog/products | admin | 商品登録 | スコープ外（既存） |
| PUT | /api/catalog/products/:id | admin | 商品更新 | スコープ外（既存） |
| DELETE | /api/catalog/products/:id | admin | 商品削除 | スコープ外（既存） |

## 本機能で実装する API

### GET /api/catalog/products

**クエリパラメータ**:

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| page | number | 1 | ページ番号（1始まり） |
| limit | number | 20 | 1ページあたりの件数（max: 100） |
| status | string | - | ステータスフィルタ（admin のみ） |
| keyword | string | - | 検索キーワード（**新規追加**） |

**レスポンス** (200):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "商品名",
        "price": 1000,
        "stock": 10,
        "description": "説明文",
        "imageUrl": "https://...",
        "status": "published",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

**購入者向け制限**:
- `status` パラメータは無視され、`published` のみ返却
- `keyword` が指定された場合、`name` と `description` で部分一致検索

### GET /api/catalog/products/:id

**パスパラメータ**:

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | UUID | 商品ID |

**レスポンス** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "商品名",
    "price": 1000,
    "stock": 10,
    "description": "説明文",
    "imageUrl": "https://...",
    "status": "published",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**エラーレスポンス** (404):
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "商品が見つかりません"
  }
}
```
