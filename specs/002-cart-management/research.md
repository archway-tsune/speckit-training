# リサーチ: カート管理機能

## 決定事項

### 1. 在庫チェックの実装箇所

**決定**: ドメインAPIレイヤー（`src/domains/cart/api/`）で在庫チェックを実装する

**根拠**:
- `src/contracts/cart.ts` の `CartItemSchema` には `stock` フィールドがない（カート内には在庫情報を持たない設計）
- `ProductFetcher` インターフェースは `{ id, name, price, imageUrl? }` のみ返す — `stock` は含まない
- 在庫チェックは `productRepository.findById()` で商品の `stock` を直接確認する必要がある
- `ProductFetcher` に `stock` フィールドを追加するか、`productRepository` を直接使用する

**代替案**:
- A) `ProductFetcher` インターフェースに `stock` を追加 → 契約変更が必要だが最もクリーン
- B) ドメインAPIで `productRepository` を直接参照 → ドメイン分離に反する
- C) 在庫チェックなしでカート追加を許可し、注文確定時にチェック → spec.md のスコープに反する

**最終決定**: **A) `ProductFetcher` に `stock` フィールドを追加**する。`src/contracts/cart.ts` の `ProductFetcher` の返り値に `stock: number` を追加し、`src/infrastructure/repositories/cart.ts` の `productFetcher` 実装も更新する。

### 2. 消費税計算の実装箇所

**決定**: カート表示UIコンポーネント内で計算する（サーバーサイドには持たない）

**根拠**:
- `CartSchema` には `subtotal`（商品合計）と `itemCount` があるが、税額・総合計のフィールドはない
- 契約スキーマを変更せず、UIレイヤーで `Math.floor(subtotal * 0.1)` で計算
- spec.md: 「商品合計・消費税（10%、端数切り捨て）・総合計を表示する」— 表示要件

**代替案**:
- `CartSchema` に `tax` と `total` フィールドを追加 → 過剰な契約変更、将来税率が変わった時に全カートの再計算が必要
- API レスポンスに含める → 現在の契約に含まれていない

### 3. カート追加成功フィードバックの実装方法

**決定**: UIコンポーネント内の状態管理で一時的なトースト風メッセージを表示

**根拠**:
- 既存のテンプレートにトーストコンポーネントはない
- 商品詳細ページ（`src/app/(buyer)/catalog/[id]/page.tsx`）にインラインメッセージを追加するのが最もシンプル
- `cart-updated` カスタムイベントは購入者レイアウトが既にリッスンしており、カート件数更新に利用可能

### 4. 二重送信防止の実装方法

**決定**: `useState` で送信中フラグを管理し、ボタンの `disabled` 属性で制御

**根拠**:
- React の標準パターン
- 既存テンプレートでも同様のパターンを使用

### 5. 確認ダイアログの実装方法

**決定**: `src/templates/ui/components/dialog/ConfirmDialog.tsx` テンプレートを使用

**根拠**:
- 憲章「テンプレート駆動開発」に準拠
- 既存の `ConfirmDialog` テンプレートがそのまま利用可能

### 6. 未ログイン時のリダイレクト

**決定**: カートページ（`src/app/(buyer)/cart/page.tsx`）でセッションチェックを行い、未ログインなら `/login?redirect=/cart` にリダイレクト。商品詳細のカート追加ボタンでは、API 401 レスポンスを受けて `/login?redirect=/catalog/{id}` にリダイレクトする。

**根拠**:
- 既存の認証フロー（Cookie ベースセッション）を活用
- `redirect` クエリパラメータでログイン後の戻り先を指定
