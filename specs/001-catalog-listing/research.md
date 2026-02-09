# リサーチ: カタログ閲覧機能

**ブランチ**: `001-catalog-listing` | **日付**: 2026-02-09

## 調査事項 1: 在庫（stock）フィールドの追加

### 決定事項
`src/contracts/catalog.ts` の `ProductSchema` に `stock: z.number().int().min(0)` フィールドを追加する。

### 根拠
- 仕様書では「在庫数」の表示、「在庫切れ」（stock === 0）の判定、カート追加ボタンの無効化が必須要件
- 現在の `ProductSchema` には `stock` フィールドが存在しない
- `stock` を追加することで、在庫0判定による「在庫切れ」表示（FR-004）、詳細画面での在庫数表示（FR-006）、ボタン無効化（FR-008）をすべて実現可能

### 検討した代替案
- **`status` フィールドで代替**: `status: 'out_of_stock'` を追加する案 → 在庫数の表示要件（FR-006）を満たせないため却下
- **別テーブル/別エンティティ**: 在庫を独立エンティティとする案 → EC サイトの規模に対して過剰設計のため却下

### 影響範囲
- `src/contracts/catalog.ts`: `ProductSchema` に `stock` フィールド追加
- `src/infrastructure/repositories/product.ts`: サンプルデータに `stock` 値追加
- `src/samples/` 配下: 既存のサンプルコード内のモックデータに `stock` 追加（ビルド破壊防止）
- 新規テスト・コンポーネントでは `stock` を活用

## 調査事項 2: 検索機能の実装方式

### 決定事項
リポジトリの `findAll` パラメータに `keyword?: string` を追加し、インメモリでの部分一致検索を行う。

### 根拠
- 仕様書では商品名・説明文を対象としたキーワード検索が必須（FR-010）
- インメモリリポジトリのため、`Array.filter()` で `name` と `description` に対する `includes()` 検索が最もシンプル
- API エンドポイントは既存の `GET /api/catalog/products` にクエリパラメータ `keyword` を追加

### 検討した代替案
- **全文検索エンジン**: Elasticsearch 等 → トレーニングプロジェクトには過剰
- **正規表現検索**: `RegExp` ベース → 仕様に部分一致とあるため `includes()` で十分

## 調査事項 3: ページネーションの件数設定

### 決定事項
仕様書に従い、1ページあたり12件とする。`GetProductsInputSchema` の `limit` デフォルト値を12に変更するのではなく、本番ユースケースで `limit: 12` を明示的に指定する。

### 根拠
- 契約スキーマのデフォルト値（20件）はサンプル含む共通仕様として維持
- 本番の商品一覧ページコンポーネント側で `limit: 12` を指定
- これにより、契約の互換性を保ちつつ仕様要件を満たせる

## 調査事項 4: 商品画像の Unsplash URL

### 決定事項
サンプルデータの `imageUrl` を Unsplash の画像 URL に変更する。`https://images.unsplash.com/` の URL を使用する。

### 根拠
- ユーザー指示で Unsplash の高品質画像を使用するよう指定あり
- 現在は `picsum.photos` を使用中 → Unsplash に置き換え
- URL は `https://images.unsplash.com/photo-{id}?w=400&h=400&fit=crop` 形式を使用

### 注意事項
- Unsplash URL が 404 にならないよう、使用前に有効性を確認する必要がある
- `next.config.mjs` の `images.remotePatterns` に `images.unsplash.com` を追加する必要がある可能性

## 調査事項 5: スコープ制限 — カート機能

### 決定事項
カート追加ボタンは詳細画面に表示するが、クリック時の動作は実装しない（FR-014）。ボタンの `disabled` 状態のみ在庫に基づいて制御する。

### 根拠
- 仕様書に「カート機能自体の実装はスコープ外」と明記
- ボタン表示と disabled 制御は本機能のスコープ内
- `onAddToCart` コールバックは props として受け取るが、本番ページでは未接続

## 調査事項 6: 本番ページのデータフェッチ方式

### 決定事項
本番ページ（`src/app/(buyer)/catalog/page.tsx`）は Client Component として実装し、`useEffect` + `fetch` で API からデータを取得する。

### 根拠
- サンプルページの実装パターンに準拠
- 検索・ページネーションの状態管理が必要なため Client Component が適切
- API Routes（`/api/catalog/products`）は既に配置済みで、ドメインスタブ置換後に自動的に動作する
