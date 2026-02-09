# カートAPI契約

## エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | /api/cart | カート取得 | buyer必須 |
| POST | /api/cart/items | カートに商品追加 | buyer必須 |
| PUT | /api/cart/items/:productId | カート内商品の数量更新 | buyer必須 |
| DELETE | /api/cart/items/:productId | カートから商品削除 | buyer必須 |

## GET /api/cart

**入力**: なし（セッションからユーザー特定）

**出力**: `Cart` オブジェクト

**エラー**:
- 401: 未認証
- 403: buyer ロール以外

**備考**: カートが存在しない場合は空のカートを自動作成して返す

## POST /api/cart/items

**入力**:
```json
{
  "productId": "UUID（必須）",
  "quantity": "整数（任意、デフォルト: 1、最小: 1）"
}
```

**出力**: 更新後の `Cart` オブジェクト

**ビジネスルール**:
- 商品が存在しない場合: 404 NotFoundError
- 在庫切れ（stock === 0）の場合: 400 バリデーションエラー
- 追加後の数量が在庫数を超える場合: 400 バリデーションエラー
- カートに同一商品が既に存在する場合: quantity を加算（重複行を作らない）

**エラー**:
- 400: バリデーションエラー（不正なID、数量0以下、在庫超過）
- 401: 未認証
- 404: 商品が見つからない

## PUT /api/cart/items/:productId

**入力**:
```json
{
  "quantity": "整数（必須、1〜99）"
}
```

**出力**: 更新後の `Cart` オブジェクト

**ビジネスルール**:
- 数量は1〜99の範囲
- 在庫数を超える数量は拒否
- カートにアイテムが存在しない場合: 404 CartItemNotFoundError

**エラー**:
- 400: バリデーションエラー（数量範囲外、在庫超過）
- 401: 未認証
- 404: カートアイテムが見つからない

## DELETE /api/cart/items/:productId

**入力**: パスパラメータ `productId`

**出力**: 更新後の `Cart` オブジェクト

**ビジネスルール**:
- カートにアイテムが存在しない場合: 404 CartItemNotFoundError

**エラー**:
- 401: 未認証
- 404: カートアイテムが見つからない

## 共通レスポンス形式

**成功時**:
```json
{
  "success": true,
  "data": { /* Cart オブジェクト */ }
}
```

**エラー時**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

## 既存契約ファイル

すべてのスキーマは `src/contracts/cart.ts` に定義済み:
- `GetCartInputSchema` / `GetCartOutputSchema`
- `AddToCartInputSchema` / `AddToCartOutputSchema`
- `UpdateCartItemInputSchema` / `UpdateCartItemOutputSchema`
- `RemoveFromCartInputSchema` / `RemoveFromCartOutputSchema`
- `CartRepository` / `ProductFetcher` インターフェース
