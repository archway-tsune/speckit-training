# リサーチ: 注文機能

**作成日**: 2026-02-09
**ブランチ**: `003-order-management`

## 調査結果

### 1. ステータス遷移パターン

**決定**: `src/contracts/orders.ts` に定義済みの `ValidStatusTransitions` マップをステートマシンとして使用する

**根拠**: 契約ファイルに既にステータス遷移ルールが `Record<OrderStatus, OrderStatus[]>` 形式で定義されており、ドメイン層（`updateOrderStatus` ユースケース）と UI 層（ボタンの有効/無効判定）の両方から参照できる。新規のステートマシンライブラリは不要。

**検討した代替案**:
- XState 等の外部ステートマシンライブラリ → 過剰な依存。シンプルなマップで十分
- ドメイン層のみでバリデーション → UI 側でも遷移可能先を表示するため、契約レベルで共有が必要

### 2. チェックアウトフローの設計

**決定**: カートページに「注文手続きへ」ボタン → `/checkout` 確認画面 → POST /api/orders → `/order-complete` 完了画面の 3 ステップフロー

**根拠**: spec.md の SC-001「3 ステップ以内で注文完了」を満たす最小構成。チェックアウト画面はカート内容の読み取り専用表示で、入力フォームは不要（決済・配送先はスコープ外）。

**検討した代替案**:
- カートページ内にインライン確認ダイアログ → 2 ステップだが UX が窮屈になり、将来の決済・配送先追加に対応しにくい
- 複数ステップのウィザード → スコープ外の決済・配送先がないため不要

### 3. 注文金額の計算方式

**決定**: カートの `subtotal`（税抜小計）を注文の `totalAmount` としてそのまま使用する

**根拠**: spec.md の FR-007「注文金額にはカートの税抜小計を使用」に準拠。税込表示は UI 層で行う（CartView と同じ `Math.floor(subtotal * 0.1)` パターン）。

### 4. カートクリアのタイミング

**決定**: 注文作成の API レスポンス成功後に、サーバーサイド（`cartFetcher.clear()`）でクリアし、クライアントサイドで `cart-updated` イベントを発火する

**根拠**: サンプル実装 `src/samples/domains/orders/api/usecases.ts` の `createOrder` が同パターンを採用。サーバーサイドでカートクリアすることで、API 呼び出し失敗時にカートが残る安全設計。

### 5. 購入者と管理者の UI 分離

**決定**: `src/domains/orders/ui/index.tsx`（購入者向け: OrderList, OrderDetail, CheckoutView, OrderCompletePage）と `src/domains/orders/ui/admin.tsx`（管理者向け: AdminOrderList, AdminOrderDetail）に分離する

**根拠**: 購入者と管理者では表示内容と操作が大きく異なる（購入者: 閲覧のみ、管理者: ステータス更新あり）。同一ファイルに詰め込むとファイルサイズが肥大化し、関心の分離が損なわれる。サンプルの `src/samples/domains/orders/ui/` も `OrderList.tsx` と `OrderDetail.tsx` に分離している。

### 6. 管理者ページのページネーション

**決定**: 管理者の注文一覧にもページネーション（20 件/ページ）を適用する

**根拠**: 購入者側は spec.md FR-010 で 20 件/ページが明記。管理者側は全注文を扱うためさらに多くの件数が想定される。同じページネーションコンポーネント（`src/templates/ui/components/navigation/Pagination.tsx`）を再利用する。
