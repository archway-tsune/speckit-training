# リサーチレポート: 商品カタログ閲覧

**ブランチ**: `001-catalog-listing`
**作成日**: 2026-02-08

## R-001: 在庫数フィールドの追加

**課題**: 現在の `src/contracts/catalog.ts` の `ProductSchema` には `stock`（在庫数）フィールドが存在しない。仕様では在庫数の表示と「在庫切れ」表示が必要。

**決定**: `ProductSchema` に `stock: z.number().int().min(0).default(0)` フィールドを追加する。

**根拠**:
- 仕様書 FR-004 で在庫0の場合「在庫切れ」表示が必須
- 仕様書 FR-007 で商品詳細に在庫数を表示が必須
- 仕様書 FR-009 で在庫0の場合カート追加ボタン無効化が必須
- `src/templates/ui/DESIGN_GUIDE.md` でも `item.stock` の参照あり

**検討した代替案**:
- `status` に 'out_of_stock' を追加する案 → 在庫数の表示ができないため不採用
- 別テーブルで在庫管理する案 → 現時点では過剰設計のため不採用

**影響範囲**:
- `src/contracts/catalog.ts`: ProductSchema にフィールド追加
- `src/infrastructure/repositories/product.ts`: サンプルデータに stock 追加
- `src/samples/domains/catalog/`: サンプルコードの型整合性更新が必要
- `CreateProductInputSchema`, `UpdateProductInputSchema`: stock フィールド追加

## R-002: 検索機能のコントラクト拡張

**課題**: 現在の `GetProductsInputSchema` には検索キーワードパラメータが存在しない。仕様では商品名・説明文のキーワード検索が必要。

**決定**: `GetProductsInputSchema` に `keyword: z.string().max(200).optional()` を追加する。

**根拠**:
- 仕様書 FR-011 でキーワード検索が必須
- 既存のページネーションAPIに統合することで、検索結果もページネーション対応が可能
- SearchBar テンプレートコンポーネントが利用可能

**検討した代替案**:
- 別エンドポイント `/api/catalog/search` を作成する案 → 既存の一覧取得APIと重複するため不採用
- クライアントサイド検索する案 → 全商品をフロントに持つ必要がありスケーラビリティの問題があるため不採用

**影響範囲**:
- `src/contracts/catalog.ts`: GetProductsInputSchema に keyword 追加
- `src/infrastructure/repositories/product.ts`: ProductRepository の findAll に keyword フィルタ追加
- `src/contracts/catalog.ts`: ProductRepository インターフェースの findAll/count パラメータに keyword 追加
- `src/app/api/catalog/products/route.ts`: クエリパラメータから keyword を取得
- `src/app/(buyer)/catalog/page.tsx`: SearchBar を統合

## R-003: ページネーション件数の変更

**課題**: 現在の `GetProductsInputSchema` のデフォルト `limit` は 20 だが、仕様では 12件/ページ。

**決定**: ページコンポーネント側で `limit=12` を指定してAPIを呼び出す。コントラクトのデフォルト値（20）は変更しない。

**根拠**:
- コントラクトのデフォルト値は汎用的に保つべき
- 管理画面では異なる件数（例: 20件/ページ）を使用する可能性がある
- ページコンポーネントで明示的に指定する方が意図が明確

**検討した代替案**:
- コントラクトのデフォルト値を12に変更 → 他の利用箇所に影響するため不採用

## R-004: 商品画像の方針

**課題**: ユーザー入力で「Unsplash の高品質な画像を使用する」と指定。現在のサンプルデータは `picsum.photos` を使用。

**決定**: サンプル商品データの imageUrl を Unsplash の固定画像URLに置き換える。`https://images.unsplash.com/` 形式で、各商品に適した実在する高品質画像を使用する。

**根拠**:
- Unsplash は無料で高品質な画像を提供
- 固定URL（photo ID指定）を使用すれば安定的にアクセス可能
- Next.js の Image コンポーネントではなく `<img>` タグで直接表示（サンプルの既存パターンに準拠）

**注意点**:
- Unsplash URLは 404 になる可能性があるため、使用前に疎通確認が必要
- プレースホルダー画像のフォールバックは既存のサンプルパターンを踏襲

## R-005: ドメイン実装の置換戦略

**課題**: 現在の `src/domains/catalog/` は `src/samples/` への再エクスポートのみ。本番実装に置き換える必要がある。

**決定**: 以下の順序で段階的に置換する。

1. コントラクトの拡張（stock, keyword フィールド追加）
2. リポジトリの拡張（検索・在庫対応）
3. `src/domains/catalog/types/` に型定義を配置
4. `src/domains/catalog/api/` にユースケースを実装（サンプルをベースに拡張）
5. `src/domains/catalog/ui/` にUIコンポーネントを実装（在庫表示・検索機能追加）
6. 既存のApp Router ページを更新
7. ナビゲーションリンクの追加

**根拠**:
- 憲法 IV「実装ワークフロー」に準拠
- サンプルコードを参考にしつつ、仕様要件（在庫・検索）を追加実装
- テストファーストで各ステップを検証

## R-006: ナビゲーションリンクの追加

**課題**: 購入者レイアウトの navLinks にカタログリンクを追加する必要がある。

**決定**: `src/app/(buyer)/layout.tsx` の navLinks 配列に `{ href: '/catalog', label: '商品一覧' }` を追加する。

**根拠**:
- 憲法 IV に「ドメイン実装時にレイアウトファイルの navLinks にナビゲーションリンクを追加しなければならない」と明記
- 既存のコメントで追加位置が示されている（77-81行目）

**影響範囲**:
- `src/app/(buyer)/layout.tsx`: navLinks 配列の更新
