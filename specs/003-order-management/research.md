# リサーチ: 注文機能

## 技術的意思決定

### 1. ステートマシンパターンによるステータス遷移管理

**決定**: `src/contracts/orders.ts` の `ValidStatusTransitions` マップをステートマシンとして使用する。

**根拠**: 既存コントラクトに `ValidStatusTransitions: Record<OrderStatus, OrderStatus[]>` が定義済み。遷移ルールが仕様と完全に一致する（pending→confirmed/cancelled、confirmed→shipped/cancelled、shipped→delivered、delivered/cancelled→遷移不可）。

**検討した代替案**:
- クラスベースのステートマシンライブラリ（xstate等）→ 過度な複雑さ。遷移ルールが5状態のシンプルなマップで十分表現可能
- if/else チェーン → 保守性が低く、遷移ルール追加時にバグが発生しやすい

### 2. 注文金額の計算方法

**決定**: カートの `subtotal`（税抜小計）をそのまま `totalAmount` として使用する。

**根拠**: 仕様に「注文金額にはカートの税抜小計を使用する」と明記。既存サンプルの `createOrder` ユースケースも `cart.subtotal` を使用。

**検討した代替案**:
- 税込合計を使用 → 仕様に反する
- 注文時に再計算 → カートの subtotal で十分。再計算はスコープ外

### 3. ドメイン構造と既存スキャフォールドの置き換え

**決定**: `src/domains/orders/` のスキャフォールド（samples 再エクスポート）を本番実装に段階的に置き換える。

**根拠**: 憲法の「実装ワークフロー」原則に準拠。既存パターン（catalog, cart）と同じアプローチ。

**置き換え対象**:
- `src/domains/orders/api/index.ts` → samples からの再エクスポートを本番 usecases に切り替え
- `src/domains/orders/ui/index.ts` → samples からの再エクスポートを本番コンポーネントに切り替え

### 4. インフラ層の利用方針

**決定**: 既存の `src/infrastructure/repositories/order.ts` をそのまま利用する。

**根拠**: インメモリリポジトリが `OrderRepository` インターフェースを完全に実装済み。`globalThis.__orderStore` によるHMR対応も完備。`CartFetcher` インターフェースも実装済み。

### 5. API ルートの利用方針

**決定**: 既存の `src/app/api/orders/route.ts` と `src/app/api/orders/[id]/route.ts` をそのまま利用する。

**根拠**: API ルートはコントラクトに準拠したハンドラパターンで実装済み。ドメインの `api/index.ts` からのインポートを使用しているため、本番ユースケースに切り替えれば自動的に本番コードが使われる。

### 6. ページの利用方針

**決定**: 既存のページファイル（checkout, orders, admin/orders）をそのまま利用する。UIコンポーネントのみ本番実装に置き換える。

**根拠**: ページファイルはドメインの `ui/index.ts` からコンポーネントをインポートしているため、UIエクスポートを本番コンポーネントに切り替えれば自動的に反映される。

### 7. 購入者の注文一覧ページパス

**決定**: `/orders` パスを使用する（`src/app/(buyer)/orders/` に配置）。

**根拠**: 既存のサンプル OrderList コンポーネントが `/orders/{id}` へのリンクを生成しており、チェックアウト完了後のリダイレクト先も `/orders/{id}?completed=true`。
