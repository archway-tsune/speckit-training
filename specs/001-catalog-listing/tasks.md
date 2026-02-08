# タスク一覧: 商品カタログ閲覧

**入力**: `specs/001-catalog-listing/` の設計ドキュメント群
**前提**: plan.md（必須）、spec.md（必須）、research.md、data-model.md、contracts/

**テスト**: TDDアプローチ — 各ユースケースにテストタスクを含む。テストを先に書き、失敗を確認してから実装する。

**構成**: タスクはユーザーストーリー単位で構成され、各ストーリーを独立して実装・テスト可能にする。

## 形式: `[ID] [P?] [Story] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存なし）
- **[Story]**: 所属するユーザーストーリー（例: US1, US2, US3）
- 各タスクの説明にはファイルパスを含む

---

## フェーズ1: セットアップ（共通インフラ）

**目的**: テストディレクトリ構造の作成とテスト環境の準備

- [ ] T001 テストディレクトリ構造を作成する — `tests/unit/domains/catalog/`、`tests/integration/domains/catalog/`、`tests/e2e/catalog/` ディレクトリを作成
- [ ] T002 [P] ドメインディレクトリ構造を作成する — `src/domains/catalog/types/`、`src/domains/catalog/api/`、`src/domains/catalog/ui/` ディレクトリが存在することを確認（既存の api/index.ts と ui/index.ts は後のフェーズで置換）

---

## フェーズ2: 基盤（ブロッキング前提条件）

**目的**: 全ユーザーストーリーの前提となるコントラクト拡張・リポジトリ更新・サンプル整合性を完了する

**⚠️ 重要**: このフェーズが完了するまでユーザーストーリーの実装は開始できない

### テスト: コントラクト・リポジトリ基盤

> **注意: テストを先に書き、実装前に失敗（Red）を確認すること**

- [ ] T003 [P] コントラクトのバリデーション単体テストを作成する — `tests/unit/domains/catalog/usecases.test.ts` に以下のテストケースを記述: (1) ProductSchema が stock フィールド（0以上の整数、デフォルト0）を受け入れること (2) GetProductsInputSchema が keyword フィールド（最大200文字、任意）を受け入れること (3) CreateProductInputSchema が stock フィールドを受け入れること (4) UpdateProductInputSchema が stock フィールド（任意）を受け入れること。テスト対象は `@/contracts/catalog` のスキーマ群
- [ ] T004 [P] リポジトリの検索・フィルタ統合テストを作成する — `tests/integration/domains/catalog/api.test.ts` に以下のテストケースを記述: (1) findAll が keyword で商品名を部分一致検索できること (2) findAll が keyword で説明文を部分一致検索できること (3) keyword 検索が大文字小文字を区別しないこと (4) keyword に該当なしの場合空配列を返すこと (5) count が filter オブジェクト（status + keyword）で正しい件数を返すこと (6) findAll が status と keyword を同時にフィルタできること。テスト対象は `@/infrastructure/repositories` の productRepository

### 実装: コントラクト拡張

- [ ] T005 ProductSchema に stock フィールドを追加する — `src/contracts/catalog.ts` の ProductSchema に `stock: z.number().int().min(0).default(0)` を追加。status フィールドの直前に配置
- [ ] T006 GetProductsInputSchema に keyword フィールドを追加する — `src/contracts/catalog.ts` の GetProductsInputSchema に `keyword: z.string().max(200).optional()` を追加
- [ ] T007 [P] CreateProductInputSchema に stock フィールドを追加する — `src/contracts/catalog.ts` の CreateProductInputSchema に `stock: z.number().int().min(0, '在庫数は0以上で入力してください').default(0)` を追加
- [ ] T008 [P] UpdateProductInputSchema に stock フィールドを追加する — `src/contracts/catalog.ts` の UpdateProductInputSchema に `stock: z.number().int().min(0).optional()` を追加
- [ ] T009 ProductRepository インターフェースを更新する — `src/contracts/catalog.ts` の ProductRepository インターフェースで (1) findAll の params に `keyword?: string` を追加 (2) count のシグネチャを `count(filter?: { status?: Product['status']; keyword?: string }): Promise<number>` に変更

### 実装: リポジトリ更新

- [ ] T010 サンプル商品データに stock フィールドと Unsplash 画像URLを追加する — `src/infrastructure/repositories/product.ts` の sampleProducts を更新: (1) 既存の各商品に stock フィールドを追加（在庫0の商品を1件以上含める） (2) 商品画像URLを Unsplash の高品質画像URL（`https://images.unsplash.com/photo-xxx?w=400&h=400&fit=crop` 形式）に変更 (3) ページネーション検証用にサンプル商品を合計15件以上に拡充。Unsplash URL は事前に疎通確認すること
- [ ] T011 リポジトリの findAll に keyword 検索ロジックを追加する — `src/infrastructure/repositories/product.ts` の findAll メソッドで (1) params.keyword が指定された場合、name と description の両方を対象に部分一致検索（大文字小文字区別なし）を実行 (2) keyword フィルタは status フィルタの後、ソートの前に適用
- [ ] T012 リポジトリの count メソッドシグネチャを更新する — `src/infrastructure/repositories/product.ts` の count メソッドを (1) 引数を `filter?: { status?: Product['status']; keyword?: string }` に変更 (2) status と keyword の両方でフィルタした件数を返すように実装

### 実装: サンプルコード整合性更新

- [ ] T013 サンプルドメインのコントラクト整合性を更新する — `src/samples/domains/catalog/` 配下のファイルで、ProductSchema の stock フィールド追加・ProductRepository インターフェース変更に伴う型エラーを解消する。具体的には (1) `src/samples/domains/catalog/api/usecases.ts` の getProducts で count 呼び出しを新シグネチャ（filter オブジェクト）に更新 (2) サンプル UI コンポーネントは stock を使用しないためそのまま維持

### 検証

- [ ] T014 フェーズ2のテストを実行し全て合格することを確認する — `npx vitest run tests/unit/domains/catalog/usecases.test.ts tests/integration/domains/catalog/api.test.ts` を実行し、T003・T004 で作成した全テストが Green になることを確認。TypeScript コンパイルエラーが0件であることも確認

**チェックポイント**: コントラクト・リポジトリの基盤が完成し、ユーザーストーリーの実装を開始できる状態

---

## フェーズ3: ユーザーストーリー1 — 商品一覧の閲覧 (優先度: P1) 🎯 MVP

**ゴール**: 購入者が商品カタログを一覧形式で閲覧できる。カード形式で12件/ページ表示、ページネーション、在庫切れ表示、空一覧メッセージを提供する。

**独立テスト**: 商品一覧ページ（`/catalog`）にアクセスし、商品カードが正しく表示され、ページネーションで全商品を閲覧できることを確認する。

### テスト: ユーザーストーリー1 ⚠️

> **注意: テストを先に書き、実装前に失敗（Red）を確認すること**

- [ ] T015 [P] [US1] getProducts ユースケースの単体テストを作成する — `tests/unit/domains/catalog/usecases.test.ts` に追記: (1) buyer ロールで published 商品のみ取得できること (2) ページネーション（page, limit）が正しく動作すること (3) keyword が指定された場合リポジトリに渡されること (4) 商品が0件の場合空配列と pagination.total=0 を返すこと。モックリポジトリを使用し `src/domains/catalog/api` の getProducts をテスト
- [ ] T016 [P] [US1] ProductCard コンポーネントの単体テストを作成する — `tests/unit/domains/catalog/components.test.tsx` に記述: (1) 商品画像・商品名・価格・在庫状況が表示されること (2) 在庫0の商品に「在庫切れ」と表示されること (3) 在庫がある商品には在庫切れ表示がないこと (4) 画像未設定の場合プレースホルダーが表示されること (5) 商品名をクリックすると `/catalog/{id}` へのリンクであること。React Testing Library を使用し `src/domains/catalog/ui/ProductCard` をテスト
- [ ] T017 [P] [US1] ProductList コンポーネントの単体テストを作成する — `tests/unit/domains/catalog/components.test.tsx` に追記: (1) 商品がグリッド形式で表示されること (2) ローディング状態で「商品を読み込み中...」が表示されること (3) エラー状態でエラーメッセージが表示されること (4) 商品0件で「商品がありません」が表示されること (5) ページネーション情報が正しく表示されること (6) 前へ/次へボタンが境界で無効化されること。`src/domains/catalog/ui/ProductList` をテスト
- [ ] T018 [P] [US1] 商品一覧API統合テストを作成する — `tests/integration/domains/catalog/api.test.ts` に追記: (1) GET /api/catalog/products が published 商品をページネーション付きで返すこと (2) limit=12 指定時に最大12件返すこと (3) page=2 で次の12件が返ること (4) 未認証でも商品一覧を取得できること（FR-014）。productRepository を直接使用してユースケース経由でテスト
- [ ] T019 [US1] 商品一覧の E2E テストを作成する — `tests/e2e/catalog/buyer-catalog.spec.ts` に記述: (1) /catalog にアクセスすると商品カードが表示される (2) 12件を超える場合ページネーションが表示される (3) 「次へ」ボタンで2ページ目に遷移できる (4) 在庫0の商品に「在庫切れ」が表示される (5) 認証なしでアクセス可能である。Playwright を使用

### 実装: ユーザーストーリー1

- [ ] T020 [US1] ドメイン固有型を定義する — `src/domains/catalog/types/index.ts` を作成し、Pagination インターフェース（page, limit, total, totalPages）を定義してエクスポートする
- [ ] T021 [US1] getProducts ユースケースを本番実装する — `src/domains/catalog/api/usecases.ts` を作成し、getProducts 関数を実装する: (1) `@/foundation/validation/runtime` の validate で入力をバリデーション (2) buyer ロールは published のみ取得 (3) keyword パラメータをリポジトリに渡す (4) ページネーション計算（offset = (page-1)*limit）(5) `@/contracts/catalog` のスキーマに準拠。`src/samples/domains/catalog/api/usecases.ts` の getProducts を参考にする
- [ ] T022 [US1] ドメインAPI の index.ts を本番実装に切り替える — `src/domains/catalog/api/index.ts` を更新し、`@/samples/domains/catalog/api` からの再エクスポートを `./usecases` からのエクスポートに変更する。getProducts, NotFoundError, CatalogContext 型をエクスポート。既存の getProductById, createProduct, updateProduct, deleteProduct は一時的にサンプルからの再エクスポートを維持する
- [ ] T023 [US1] ProductCard コンポーネントを本番実装する — `src/domains/catalog/ui/ProductCard.tsx` を作成: (1) 商品画像・商品名・価格を表示 (2) 在庫0の場合「在庫切れ」バッジを表示 (3) 画像未設定時は SVG プレースホルダーを表示 (4) 商品名が `/catalog/{id}` へのリンク (5) Tailwind CSS でカード形式スタイリング。`src/samples/domains/catalog/ui/ProductCard.tsx` を参考に stock 対応を追加
- [ ] T024 [US1] ProductList コンポーネントを本番実装する — `src/domains/catalog/ui/ProductList.tsx` を作成: (1) ProductCard のグリッド表示（sm:2, lg:3, xl:4）(2) `@/templates/ui/components/status/Loading` でローディング状態 (3) `@/templates/ui/components/status/Error` でエラー状態 (4) `@/templates/ui/components/status/Empty` で空状態（「商品がありません」）(5) ページネーション UI（「全N件中 M〜L件を表示」、前へ/次へボタン）。`src/samples/domains/catalog/ui/ProductList.tsx` を参考にする
- [ ] T025 [US1] ドメインUI の index.ts を本番実装に切り替える — `src/domains/catalog/ui/index.ts` を更新し、`@/samples/domains/catalog/ui` からの再エクスポートを `./ProductList`, `./ProductCard` からのエクスポートに変更する。ProductDetail は一時的にサンプルからの再エクスポートを維持する
- [ ] T026 [US1] 商品一覧APIルートに keyword パラメータ受け渡しを追加する — `src/app/api/catalog/products/route.ts` の GET ハンドラを更新: (1) searchParams から keyword を取得 (2) input オブジェクトに keyword を追加して getProducts に渡す
- [ ] T027 [US1] 商品一覧ページに limit=12 とページネーション連携を実装する — `src/app/(buyer)/catalog/page.tsx` を更新: (1) fetchProducts の API 呼び出しで `limit=12` を指定 (2) ページネーションの onPageChange で fetchProducts(page) を呼び出す

### 検証

- [ ] T028 [US1] フェーズ3の全テストを実行し合格を確認する — 単体テスト（T015-T017）、統合テスト（T018）、E2Eテスト（T019）をすべて実行し Green を確認。`npx vitest run tests/unit/domains/catalog/ tests/integration/domains/catalog/` と `npx playwright test tests/e2e/catalog/` を実行

**チェックポイント**: 商品一覧ページが完全に機能し、独立してテスト可能な状態。購入者は認証なしでカタログを閲覧・ページ遷移でき、在庫切れ商品を識別できる。

---

## フェーズ4: ユーザーストーリー2 — 商品詳細の確認 (優先度: P2)

**ゴール**: 購入者が商品の詳細情報（画像・名前・価格・説明文・在庫数）を確認し、在庫がある場合はカート追加ボタンを操作できる。

**独立テスト**: 商品詳細ページ（`/catalog/{id}`）にアクセスし、すべての商品情報が表示され、在庫状況に応じたカート追加ボタンの動作を確認する。

### テスト: ユーザーストーリー2 ⚠️

> **注意: テストを先に書き、実装前に失敗（Red）を確認すること**

- [ ] T029 [P] [US2] getProductById ユースケースの単体テストを作成する — `tests/unit/domains/catalog/usecases.test.ts` に追記: (1) 存在する商品IDで商品情報（stock含む）が返ること (2) 存在しない商品IDで NotFoundError がスローされること (3) buyer ロールで draft 商品にアクセスすると NotFoundError がスローされること (4) 返却される商品に stock フィールドが含まれること。モックリポジトリを使用し `src/domains/catalog/api` の getProductById をテスト
- [ ] T030 [P] [US2] ProductDetail コンポーネントの単体テストを作成する — `tests/unit/domains/catalog/components.test.tsx` に追記: (1) 商品画像・商品名・価格・説明文・在庫数が表示されること (2) 在庫がある場合カート追加ボタンが有効であること (3) 在庫が0の場合カート追加ボタンが無効化（disabled）されていること (4) 在庫0の場合「在庫切れ」テキストが表示されること (5) 画像未設定時プレースホルダーが表示されること (6) 戻るボタンが表示され onBack が呼ばれること。`src/domains/catalog/ui/ProductDetail` をテスト
- [ ] T031 [P] [US2] 商品詳細API統合テストを作成する — `tests/integration/domains/catalog/api.test.ts` に追記: (1) 有効な商品IDで商品詳細（stock含む）が返ること (2) 存在しない商品IDで NotFoundError がスローされること (3) draft 商品に buyer ロールでアクセスすると NotFoundError がスローされること。productRepository を直接使用してユースケース経由でテスト
- [ ] T032 [US2] 商品詳細の E2E テストを作成する — `tests/e2e/catalog/buyer-catalog.spec.ts` に追記: (1) 一覧から商品をクリックすると詳細ページに遷移する (2) 詳細ページに商品画像・名前・価格・説明文・在庫数が表示される (3) 在庫0の商品でカート追加ボタンが無効化されている (4) 戻るボタンで一覧に戻れる

### 実装: ユーザーストーリー2

- [ ] T033 [US2] getProductById ユースケースを本番実装する — `src/domains/catalog/api/usecases.ts` に getProductById 関数を追加: (1) `@/foundation/validation/runtime` の validate で入力をバリデーション (2) リポジトリから商品を取得 (3) 商品が存在しない場合 NotFoundError をスロー (4) buyer ロールで published 以外の商品は NotFoundError。`src/samples/domains/catalog/api/usecases.ts` の getProductById を参考にする
- [ ] T034 [US2] ドメインAPI の index.ts から getProductById を本番実装エクスポートに切り替える — `src/domains/catalog/api/index.ts` を更新し、getProductById のエクスポート元を `./usecases` に変更する
- [ ] T035 [US2] ProductDetail コンポーネントを本番実装する — `src/domains/catalog/ui/ProductDetail.tsx` を作成: (1) 商品画像（未設定時はプレースホルダー）(2) 商品名・価格（¥フォーマット）・説明文 (3) 在庫数の表示 (4) 在庫0の場合「在庫切れ」テキストとカート追加ボタン無効化（disabled 属性）(5) 在庫ありの場合カート追加ボタン有効 (6) 戻るボタン。`src/samples/domains/catalog/ui/ProductDetail.tsx` を参考に stock 対応を追加
- [ ] T036 [US2] ドメインUI の index.ts から ProductDetail を本番実装エクスポートに切り替える — `src/domains/catalog/ui/index.ts` を更新し、ProductDetail のエクスポート元を `./ProductDetail` に変更する

### 検証

- [ ] T037 [US2] フェーズ4の全テストを実行し合格を確認する — 単体テスト（T029-T030）、統合テスト（T031）、E2Eテスト（T032）をすべて実行し Green を確認

**チェックポイント**: 商品一覧・商品詳細の両方が完全に機能する。一覧→詳細→戻るのフローが動作し、在庫状況に応じたボタン制御が正しく行われる。

---

## フェーズ5: ユーザーストーリー3 — 商品検索 (優先度: P3)

**ゴール**: 購入者がキーワードで商品名・説明文を検索し、検索条件をクリアして全商品に戻れる。

**独立テスト**: 検索バーにキーワードを入力し、一致する商品のみが表示され、クリアで全商品に戻ることを確認する。

### テスト: ユーザーストーリー3 ⚠️

> **注意: テストを先に書き、実装前に失敗（Red）を確認すること**

- [ ] T038 [P] [US3] 検索機能の単体テストを作成する — `tests/unit/domains/catalog/components.test.tsx` に追記: (1) SearchBar の onSearch コールバックがキーワード付きで呼ばれること (2) SearchBar のクリアボタンで onSearch が空文字で呼ばれること (3) ProductList に SearchBar が統合され表示されること。`src/domains/catalog/ui/ProductList` の検索統合をテスト
- [ ] T039 [P] [US3] 検索API統合テストを作成する — `tests/integration/domains/catalog/api.test.ts` に追記: (1) keyword 指定で商品名に一致する商品のみ返ること (2) keyword 指定で説明文に一致する商品のみ返ること (3) keyword に該当なしで空配列と pagination.total=0 を返すこと (4) keyword と pagination が同時に動作すること。getProducts ユースケース経由でテスト
- [ ] T040 [US3] 検索機能の E2E テストを作成する — `tests/e2e/catalog/buyer-catalog.spec.ts` に追記: (1) 検索バーにキーワードを入力して Enter で検索結果が絞り込まれる (2) 該当なしの場合「該当する商品が見つかりませんでした」メッセージが表示される (3) クリアボタンで全商品一覧に戻る

### 実装: ユーザーストーリー3

- [ ] T041 [US3] ProductList に SearchBar を統合する — `src/domains/catalog/ui/ProductList.tsx` を更新: (1) `@/templates/ui/components/form/SearchBar` をインポート (2) ProductList の props に `onSearch?: (keyword: string) => void` と `searchKeyword?: string` を追加 (3) 商品グリッドの上部に SearchBar を配置 (4) 検索結果が0件の場合「該当する商品が見つかりませんでした」メッセージを表示（通常の「商品がありません」とは区別）
- [ ] T042 [US3] 商品一覧ページに検索機能を統合する — `src/app/(buyer)/catalog/page.tsx` を更新: (1) searchKeyword ステートを追加 (2) handleSearch コールバックで keyword を設定し fetchProducts を呼び出す (3) fetchProducts に keyword パラメータを追加 (4) 検索クリア時（keyword が空文字）は keyword なしで再取得 (5) ProductList に onSearch と searchKeyword props を渡す

### 検証

- [ ] T043 [US3] フェーズ5の全テストを実行し合格を確認する — 単体テスト（T038）、統合テスト（T039）、E2Eテスト（T040）をすべて実行し Green を確認

**チェックポイント**: 商品一覧・詳細・検索のすべてが独立して機能する。検索→結果表示→クリア→全商品表示のフローが正しく動作する。

---

## フェーズ6: ナビゲーション追加と最終確認

**目的**: 購入者レイアウトにカタログリンクを追加し、全体の統合確認とカバレッジ検証を行う

### テスト ⚠️

> **注意: テストを先に書き、実装前に失敗（Red）を確認すること**

- [ ] T044 ナビゲーションの E2E テストを作成する — `tests/e2e/catalog/buyer-catalog.spec.ts` に追記: (1) ヘッダーのナビゲーションに「商品一覧」リンクが表示される (2) 「商品一覧」リンクをクリックすると /catalog に遷移する

### 実装

- [ ] T045 購入者レイアウトの navLinks に商品一覧リンクを追加する — `src/app/(buyer)/layout.tsx` の navLinks 配列に `{ href: '/catalog', label: '商品一覧' }` を追加する（77-82行目のコメントを解除して修正）

### 最終検証

- [ ] T046 全体 E2E テストを実行する — `tests/e2e/catalog/buyer-catalog.spec.ts` に統合テストを追記し実行: (1) ナビゲーション→一覧→商品クリック→詳細→戻る→検索→クリアの一連フロー (2) 全 E2E テストが Green であること
- [ ] T047 全テストスイートを実行しカバレッジ80%以上を確認する — `npx vitest run --coverage` を実行し、domains/catalog/ 配下のカバレッジが80%以上であることを確認。不足がある場合はテストを追加
- [ ] T048 TypeScript コンパイルと ESLint チェックを実行する — `npx tsc --noEmit` でコンパイルエラー0件、`npx eslint src/domains/catalog/ src/app/\(buyer\)/catalog/ tests/unit/domains/catalog/ tests/integration/domains/catalog/` で ESLint エラー0件を確認

---

## 依存関係と実行順序

### フェーズ依存関係

- **セットアップ（フェーズ1）**: 依存なし — 即座に開始可能
- **基盤（フェーズ2）**: セットアップ完了に依存 — **全ユーザーストーリーをブロック**
- **ユーザーストーリー（フェーズ3-5）**: 基盤フェーズ完了に依存
  - ストーリー間は優先度順に実装（P1 → P2 → P3）
  - US2 は US1 の一覧→詳細遷移に依存
  - US3 は US1 の一覧表示に SearchBar を統合するため US1 に依存
- **最終確認（フェーズ6）**: 全ユーザーストーリー完了に依存

### ユーザーストーリー依存関係

- **US1（商品一覧）**: 基盤フェーズ完了後に開始可能 — 他ストーリーへの依存なし
- **US2（商品詳細）**: US1 完了後に開始（一覧→詳細の遷移が前提）
- **US3（商品検索）**: US1 完了後に開始（ProductList への SearchBar 統合が前提）

### 各ユーザーストーリー内の順序

1. テストを先に記述し失敗（Red）を確認する
2. ユースケース（API層）を実装する
3. UIコンポーネントを実装する
4. ページ/ルートを更新する
5. テストが全て合格（Green）することを確認する

### 並列実行の機会

- フェーズ2 内: T003 と T004（テスト作成）は並列可能。T005-T009（コントラクト変更）のうち T007 と T008 は並列可能
- フェーズ3 内: T015, T016, T017, T018（テスト作成）は並列可能
- フェーズ4 内: T029, T030, T031（テスト作成）は並列可能
- フェーズ5 内: T038, T039（テスト作成）は並列可能

---

## 並列実行例: ユーザーストーリー1

```bash
# US1 のテストを並列で作成（Red フェーズ）:
タスク: "getProducts ユースケース単体テスト — tests/unit/domains/catalog/usecases.test.ts"
タスク: "ProductCard コンポーネント単体テスト — tests/unit/domains/catalog/components.test.tsx"
タスク: "ProductList コンポーネント単体テスト — tests/unit/domains/catalog/components.test.tsx"
タスク: "商品一覧API統合テスト — tests/integration/domains/catalog/api.test.ts"

# テスト失敗を確認後、実装を開始:
タスク: "getProducts ユースケース本番実装 — src/domains/catalog/api/usecases.ts"
タスク: "ProductCard コンポーネント本番実装 — src/domains/catalog/ui/ProductCard.tsx"
タスク: "ProductList コンポーネント本番実装 — src/domains/catalog/ui/ProductList.tsx"
```

---

## 実装戦略

### MVP ファースト（ユーザーストーリー1のみ）

1. フェーズ1 完了: セットアップ
2. フェーズ2 完了: 基盤（コントラクト・リポジトリ）
3. フェーズ3 完了: ユーザーストーリー1（商品一覧）
4. **停止して検証**: 商品一覧が独立して機能することを確認
5. デモ/デプロイ可能な状態

### インクリメンタルデリバリー

1. セットアップ + 基盤 → 基盤準備完了
2. US1（商品一覧）追加 → 独立テスト → デモ（MVP!）
3. US2（商品詳細）追加 → 独立テスト → デモ
4. US3（商品検索）追加 → 独立テスト → デモ
5. ナビゲーション + 最終確認 → リリース準備完了

各ストーリーは前のストーリーを壊さずに価値を追加する。

---

## 注記

- [P] タスク = 異なるファイル対象、依存なし
- [Story] ラベルはタスクと特定のユーザーストーリーを紐付ける
- 各ユーザーストーリーは独立して完了・テスト可能
- テスト失敗（Red）を確認してから実装する
- 各タスクまたは論理グループ完了後にコミットする
- チェックポイントで一時停止し、ストーリーを独立して検証する
