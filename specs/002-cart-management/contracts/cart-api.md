# カートAPI コントラクト

**作成日**: 2026-02-08
**ブランチ**: `002-cart-management`
**既存コントラクト**: `src/contracts/cart.ts`（変更なし — 既存スキーマをそのまま使用）

## エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | `/api/cart` | カート取得 | 不要（セッションベース） |
| POST | `/api/cart/items` | カートに商品追加 | 不要（セッションベース） |
| PUT | `/api/cart/items/[productId]` | 数量変更 | 不要（セッションベース） |
| DELETE | `/api/cart/items/[productId]` | 商品削除 | 不要（セッションベース） |

## 既存コントラクト（`src/contracts/cart.ts`）の利用

既存の `src/contracts/cart.ts` に定義済みのスキーマをそのまま使用する。新たなスキーマ追加は不要。

### 使用するスキーマ

- **CartItemSchema**: productId, productName, price, imageUrl, quantity, addedAt
- **CartSchema**: id, userId, items[], subtotal, itemCount, createdAt, updatedAt
- **GetCartInputSchema / GetCartOutputSchema**: カート取得
- **AddToCartInputSchema / AddToCartOutputSchema**: 商品追加（productId, quantity）
- **UpdateCartItemInputSchema / UpdateCartItemOutputSchema**: 数量変更（productId, quantity）
- **RemoveFromCartInputSchema / RemoveFromCartOutputSchema**: 商品削除（productId）

### 使用するインターフェース

- **CartRepository**: find, create, addItem, updateItemQuantity, removeItem
- **ProductFetcher**: findById — カタログドメインの商品情報を取得

## エンドポイント詳細

### GET `/api/cart` — カート取得

**リクエスト**: なし（セッションから userId を取得）

**レスポンス（成功）**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-id",
    "items": [
      {
        "productId": "uuid",
        "productName": "商品名",
        "price": 1000,
        "imageUrl": "https://...",
        "quantity": 2,
        "addedAt": "2026-01-01T00:00:00Z"
      }
    ],
    "subtotal": 2000,
    "itemCount": 1
  }
}
```

**レスポンス（カートなし）**: 空のカートを自動作成して返却

---

### POST `/api/cart/items` — カートに商品追加

**リクエストボディ**:
```json
{
  "productId": "uuid",
  "quantity": 1
}
```

**レスポンス（成功）**:
```json
{
  "success": true,
  "data": {
    "id": "cart-uuid",
    "items": [...],
    "subtotal": 3000,
    "itemCount": 2
  }
}
```

**エラーケース**:
- 404: 商品が存在しない
- 400: 在庫不足、数量が範囲外

---

### PUT `/api/cart/items/[productId]` — 数量変更

**リクエストボディ**:
```json
{
  "quantity": 3
}
```

**レスポンス（成功）**: カート全体を返却（GET と同形式）

**エラーケース**:
- 404: カートアイテムが存在しない
- 400: 数量が1〜99の範囲外、在庫数を超過

---

### DELETE `/api/cart/items/[productId]` — 商品削除

**リクエスト**: パスパラメータの productId のみ

**レスポンス（成功）**: カート全体を返却（GET と同形式）

**エラーケース**:
- 404: カートアイテムが存在しない

## UI ページ

### `/cart` — カートページ

- カートAPI（GET `/api/cart`）からデータ取得
- 商品一覧の表示（画像・名前・単価・数量・小計）
- 合計セクション: 商品合計・消費税（10%、端数切り捨て）・総合計
- 数量変更: PUT `/api/cart/items/[productId]` を呼び出し
- 商品削除: DELETE `/api/cart/items/[productId]` を呼び出し（確認ダイアログ経由）
- 空カート: 「カートに商品がありません」メッセージ + 商品一覧リンク
- カート更新時: `cart-updated` カスタムイベントを発火

### 商品詳細ページへの統合

- `src/domains/catalog/ui/ProductDetail.tsx` の `onAddToCart` コールバックを実装
- `src/app/(buyer)/catalog/[id]/page.tsx` で POST `/api/cart/items` を呼び出し
- 追加成功時: フィードバック表示 + `cart-updated` イベント発火
- 二重送信防止: ボタン disabled 状態管理
