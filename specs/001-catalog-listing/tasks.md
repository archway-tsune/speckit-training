# タスク一覧: カタログ閲覧機能

**入力**: `specs/001-catalog-listing/` の設計ドキュメント
**前提**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md
**テスト方針**: TDD（Red → Green → Refactor）を徹底。テストを先に記述し、失敗を確認してから実装する。

**構成**: ユーザーストーリー単位でフェーズを分割し、各ストーリーを独立して実装・テスト可能にする。

## 書式: `[ID] [P?] [Story?] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: 所属するユーザーストーリー（US1, US2, US3）
- 各タスクに正確なファイルパスを含む

---

## フェーズ 1: セットアップ（共有インフラストラクチャ）

**目的**: 全ユーザーストーリーが依存する契約スキーマとデータ基盤を整備する

- [x] T001 `src/contracts/catalog.ts` の `ProductSchema` に `stock: z.number().int().min(0)` フィールドを追加する。`CreateProductInputSchema` に `stock: z.number().int().min(0, '在庫数は0以上で入力してください')` を追加し、`UpdateProductInputSchema` に `stock: z.number().int().min(0).optional()` を追加する
- [x] T002 `src/contracts/catalog.ts` の `GetProductsInputSchema` に `keyword: z.string().optional()` を追加する。`ProductRepository` インターフェースの `findAll` パラメータに `keyword?: string` を追加し、`count` メソッドのシグネチャを `count(status?: Product['status'], keyword?: string): Promise<number>` に変更する
- [x] T003 `src/infrastructure/repositories/product.ts` のサンプル商品データに `stock` フィールドを追加する（E2Eテスト商品: 10, ミニマルTシャツ: 25, レザーウォレット: 8, キャンバストートバッグ: 0, ウールニット: 15, デニムパンツ: 20）。画像URLを Unsplash の高品質画像URLに変更する（`https://images.unsplash.com/photo-{id}?w=400&h=400&fit=crop` 形式）
- [x] T004 `src/infrastructure/repositories/product.ts` の `findAll` メソッドに `keyword` フィルタリング処理を追加する（`name` と `description` に対する大文字小文字を区別しない部分一致検索）。`count` メソッドにも同様の `keyword` フィルタリングを追加する
- [x] T005 `src/samples/domains/catalog/api/usecases.ts` の `getProducts` ユースケースに `keyword` パラメータの転送処理を追加する。`src/samples/` 配下の UI コンポーネント・テストで `stock` フィールド追加に伴う型エラーがあれば修正する
- [x] T006 TypeScript コンパイルを実行し、契約変更に伴うすべてのビルドエラーが解消されていることを確認する。`npx tsc --noEmit` でエラー0件

**チェックポイント**: 契約・基盤の変更が完了。サンプルコードを含むプロジェクト全体がビルド可能な状態。

---

## フェーズ 2: ユーザーストーリー 1 — 商品一覧の閲覧 (優先度: P1) 🎯 MVP

**ゴール**: 購入者が商品一覧ページで商品をカード形式で閲覧し、ページネーションで次ページに移動できる

**独立テスト**: 商品一覧ページにアクセスし、商品カードが表示されること、ページネーションが動作すること、在庫切れ商品に「在庫切れ」が表示されること、0件時に「商品がありません」が表示されることを確認

### ユーザーストーリー 1 のテスト（Red フェーズ） ⚠️

> **注意: テストを先に記述し、失敗することを確認してから実装に着手する**

- [x] T007 [P] [US1] `tests/unit/domains/catalog/usecase.test.ts` に `getProducts` ユースケースの単体テストを作成する。テストケース: (1) 購入者として published 商品一覧をページネーション付きで取得できる (2) 在庫0の商品も一覧に含まれる（除外されない） (3) 商品0件の場合に空配列とページネーション情報（total: 0, totalPages: 0）を返す (4) 購入者は published 商品のみ取得される（status が published に強制される）。`@/domains/catalog/api` からインポートし、モックリポジトリを使用する
- [x] T008 [P] [US1] `tests/unit/domains/catalog/ui.test.tsx` に `ProductCard` コンポーネントの単体テストを作成する。テストケース: (1) 商品画像・商品名・価格を表示する (2) 在庫0の商品に「在庫切れ」バッジを表示する (3) 在庫ありの商品には「在庫切れ」を表示しない (4) 画像未設定時にプレースホルダー画像を表示する (5) 商品詳細へのリンクを持つ。`@/domains/catalog/ui` からインポートする
- [x] T009 [P] [US1] `tests/unit/domains/catalog/ui.test.tsx` に `ProductList` コンポーネントの単体テストを作成する。テストケース: (1) ローディング中はローディング表示を出す (2) エラー時はエラーメッセージとリトライボタンを表示する (3) 商品0件時に「商品がありません」メッセージを表示する (4) 商品データを商品カードのグリッドで表示する (5) ページネーション情報を表示する (6) 次ページボタンクリックで onPageChange コールバックを呼ぶ (7) 最終ページでは次へボタンが無効化される。`@/domains/catalog/ui` からインポートする
- [x] T010 [P] [US1] `tests/integration/domains/catalog/api.test.ts` に `getProducts` の統合テストを作成する。テストケース: (1) 文字列の入力パラメータ（クエリパラメータ形式）が正しく変換される (2) 出力が `GetProductsOutputSchema` に準拠する (3) ページネーション計算が正確である（total, totalPages の算出）。`@/domains/catalog/api` からインポートし、モックリポジトリで契約スキーマとの整合性を検証する

### ユーザーストーリー 1 の実装（Green フェーズ）

- [x] T011 [US1] `src/domains/catalog/api/index.ts` の `getProducts` スタブを本番実装に置き換える。`src/samples/domains/catalog/api/usecases.ts` を参考に、`validate()` でバリデーション、購入者は published のみ、`repository.findAll()` と `repository.count()` を並列呼び出しし、ページネーション情報を返す。`NotFoundError`, `CatalogContext`, `ProductRepository` 型もエクスポートする。`keyword` パラメータの転送も含める
- [x] T012 [US1] `src/domains/catalog/ui/ProductCard.tsx` を新規作成する。`src/samples/domains/catalog/ui/ProductCard.tsx` を参考に、商品画像（未設定時はプレースホルダー）・商品名・価格（¥フォーマット）・在庫状況を表示する。`stock === 0` の場合は「在庫切れ」バッジを表示する。商品詳細へのリンクを含む
- [x] T013 [US1] `src/domains/catalog/ui/ProductList.tsx` を新規作成する。`src/samples/domains/catalog/ui/ProductList.tsx` を参考に、商品カードのグリッド表示（レスポンシブ: sm:2, lg:3, xl:4列）、ローディング/エラー/空状態の処理、ページネーション（前へ/次へボタン、件数表示）を実装する。テンプレートの `Loading`, `Error`, `Empty` コンポーネントを使用する
- [x] T014 [US1] `src/domains/catalog/ui/index.tsx` のスタブを本番エクスポートに置き換える。`ProductCard`, `ProductList` とそれぞれの Props 型をエクスポートする
- [x] T015 [US1] `src/app/(buyer)/catalog/page.tsx` を更新し、Client Component としてデータフェッチ・ページネーション統合を実装する。`useEffect` + `fetch` で `/api/catalog/products?page=N&limit=12` からデータ取得。ページネーション状態管理（`useState` で `page`）。ローディング/エラー/空状態の処理。`ProductList` コンポーネントを使用する
- [x] T016 [US1] `src/app/api/catalog/products/route.ts` の GET ハンドラに `keyword` クエリパラメータの取得処理を追加する（`searchParams.get('keyword') || undefined`）。input オブジェクトに `keyword` を含める
- [x] T017 [US1] `src/app/(buyer)/layout.tsx` の navLinks 配列で `{ href: '/catalog', label: '商品一覧' }` のコメントを解除して有効化する。カート（`/cart`）と注文履歴（`/orders`）のリンクはコメントアウトのまま維持する。スコープ外のリンクが含まれていないことを確認する
- [x] T018 [US1] T007〜T010 のテストがすべて通過することを確認する。`npx vitest run tests/unit/domains/catalog/ tests/integration/domains/catalog/` を実行し、全テスト GREEN

**チェックポイント**: ユーザーストーリー 1 が完全に動作。商品一覧の表示、ページネーション、在庫切れ表示、空状態表示が機能する。

---

## フェーズ 3: ユーザーストーリー 2 — 商品詳細の確認 (優先度: P2)

**ゴール**: 購入者が商品詳細画面で商品画像・商品名・価格・説明文・在庫数を確認し、在庫切れ商品ではカート追加ボタンが無効化される

**独立テスト**: 商品詳細ページにアクセスし、すべての商品情報が表示されること、在庫切れ商品でカートボタンが無効化されること、画像未設定時にプレースホルダーが表示されることを確認

### ユーザーストーリー 2 のテスト（Red フェーズ） ⚠️

> **注意: テストを先に記述し、失敗することを確認してから実装に着手する**

- [x] T019 [P] [US2] `tests/unit/domains/catalog/usecase.test.ts` に `getProductById` ユースケースの単体テストを追加する。テストケース: (1) 存在する published 商品の詳細情報（stock 含む）を返す (2) 存在しない商品 ID で NotFoundError をスローする (3) 未公開（draft/archived）商品を購入者が閲覧すると NotFoundError をスローする。`@/domains/catalog/api` からインポートする
- [x] T020 [P] [US2] `tests/unit/domains/catalog/ui.test.tsx` に `ProductDetail` コンポーネントの単体テストを追加する。テストケース: (1) 商品画像・商品名・価格・説明文・在庫数を表示する (2) 在庫あり商品でカート追加ボタンが有効である (3) 在庫0の商品でカート追加ボタンが無効化される (4) 画像未設定時にプレースホルダー画像を表示する (5) ローディング中はローディング表示を出す (6) エラー時はエラーメッセージを表示する (7) 戻るボタンクリックで onBack コールバックを呼ぶ。`@/domains/catalog/ui` からインポートする
- [x] T021 [P] [US2] `tests/integration/domains/catalog/api.test.ts` に `getProductById` の統合テストを追加する。テストケース: (1) 出力が `GetProductByIdOutputSchema` に準拠する（stock フィールド含む） (2) 一覧取得 → 詳細取得のエンドツーエンドフローが正常に動作する

### ユーザーストーリー 2 の実装（Green フェーズ）

- [x] T022 [US2] `src/domains/catalog/api/index.ts` の `getProductById` スタブを本番実装に置き換える。`validate()` で入力検証、`repository.findById()` で商品取得、存在しない場合は NotFoundError、購入者は published 以外を閲覧不可
- [x] T023 [US2] `src/domains/catalog/ui/ProductDetail.tsx` を新規作成する。`src/samples/domains/catalog/ui/ProductDetail.tsx` を参考に、商品画像（未設定時プレースホルダー）・商品名・価格（¥フォーマット）・説明文・在庫数を表示する。`stock === 0` でカート追加ボタンを `disabled` にする。在庫あり時はボタン有効。戻るボタン付き。ローディング/エラー状態の処理を含む
- [x] T024 [US2] `src/domains/catalog/ui/index.tsx` に `ProductDetail` とその Props 型のエクスポートを追加する
- [x] T025 [US2] `src/app/(buyer)/catalog/[id]/page.tsx` を更新し、Client Component としてデータフェッチ・在庫表示統合を実装する。`useEffect` + `fetch` で `/api/catalog/products/:id` からデータ取得。在庫表示・カートボタン制御。一覧ページ（`/catalog`）への戻るリンク。ローディング/エラー状態の処理
- [x] T026 [US2] T019〜T021 のテストがすべて通過することを確認する。`npx vitest run tests/unit/domains/catalog/ tests/integration/domains/catalog/` を実行し、全テスト GREEN（US1 のテストも含めてリグレッションなし）

**チェックポイント**: ユーザーストーリー 1 と 2 が独立して動作。一覧から詳細への遷移、在庫表示、カートボタン制御が機能する。

---

## フェーズ 4: ユーザーストーリー 3 — 商品検索 (優先度: P3)

**ゴール**: 購入者がキーワードで商品名・説明文を検索し、目的の商品を素早く見つけられる。該当なし時のメッセージ表示と検索クリアで全商品一覧に戻る機能を含む

**独立テスト**: 検索バーにキーワードを入力して検索実行し、一致する商品のみが表示されること、クリアボタンで全件表示に戻ることを確認

### ユーザーストーリー 3 のテスト（Red フェーズ） ⚠️

> **注意: テストを先に記述し、失敗することを確認してから実装に着手する**

- [x] T027 [P] [US3] `tests/unit/domains/catalog/usecase.test.ts` に `getProducts` のキーワード検索テストを追加する。テストケース: (1) keyword パラメータで商品名の部分一致検索ができる (2) keyword パラメータで説明文の部分一致検索ができる (3) 該当商品なしの場合に空配列を返す (4) keyword が空文字・未指定の場合は全件を返す。モックリポジトリの `findAll` が `keyword` パラメータ付きで呼び出されることを検証する
- [x] T028 [P] [US3] `tests/unit/domains/catalog/ui.test.tsx` に検索バー統合テストを追加する。テストケース: (1) 検索バーが表示される (2) キーワード入力後 Enter で onSearch コールバックが呼ばれる (3) クリアボタンで onSearch('') が呼ばれる（全商品表示に戻る）
- [x] T029 [P] [US3] `tests/integration/domains/catalog/api.test.ts` に keyword 付きリクエストの統合テストを追加する。テストケース: (1) keyword 付きの入力が `GetProductsInputSchema` に準拠する (2) keyword 付きの出力が `GetProductsOutputSchema` に準拠する (3) 検索 → 詳細取得のフローが正常に動作する

### ユーザーストーリー 3 の実装（Green フェーズ）

- [x] T030 [US3] `src/domains/catalog/ui/ProductList.tsx` に検索バー（`@/templates/ui/components/form/SearchBar`）を統合する。`onSearch` コールバック props を追加し、検索バーの入力を親コンポーネントに伝播する
- [x] T031 [US3] `src/app/(buyer)/catalog/page.tsx` に検索機能を統合する。検索キーワードの状態管理（`useState` で `keyword`）。検索時にページ番号を1にリセット。API 呼び出しに `keyword` クエリパラメータを追加（`/api/catalog/products?page=N&limit=12&keyword=XXX`）。検索結果のページネーション
- [x] T032 [US3] T027〜T029 のテストがすべて通過することを確認する。`npx vitest run tests/unit/domains/catalog/ tests/integration/domains/catalog/` を実行し、全テスト GREEN（US1・US2 のテストも含めてリグレッションなし）

**チェックポイント**: 全ユーザーストーリー（一覧・詳細・検索）が独立して動作。

---

## フェーズ 5: E2E テスト・品質検証

**目的**: 購入者導線の E2E テストで全体の動作を検証し、品質基準を満たすことを確認する

- [x] T033 `tests/e2e/catalog/buyer-flow.spec.ts` を新規作成し、購入者導線の E2E テストを実装する。テストケース: (1) 商品一覧ページが正しく表示される (2) 商品カードに画像・名前・価格・在庫状況が表示される (3) 在庫切れ商品に「在庫切れ」バッジが表示される (4) ページネーションで次ページに遷移できる (5) 商品カードクリックで詳細ページに遷移する (6) 詳細ページに画像・名前・価格・説明文・在庫数が表示される (7) 在庫切れ商品でカート追加ボタンが無効化される (8) 検索キーワードで商品がフィルタリングされる (9) 検索クリアで全商品表示に戻る (10) ナビゲーションの「商品一覧」リンクが機能する。テスト前に `/api/test/reset` で状態をリセットする
- [x] T034 TypeScript strict コンパイルチェック（`npx tsc --noEmit`）でエラー0件を確認する
- [x] T035 ESLint チェック（`npx eslint src/domains/catalog/ src/app/\\(buyer\\)/catalog/ tests/unit/domains/catalog/ tests/integration/domains/catalog/ tests/e2e/catalog/`）でエラー0件を確認する
- [x] T036 テストカバレッジを確認する。`npx vitest run --coverage` を実行し、カタログドメイン関連のカバレッジが80%以上であることを確認する
- [x] T037 全テスト（単体・統合・E2E）を一括実行し、すべて通過することを最終確認する。`npx vitest run && npx playwright test tests/e2e/catalog/`

---

## 依存関係と実行順序

### フェーズ依存関係

- **セットアップ（フェーズ 1）**: 依存なし — 即座に開始可能
- **US1（フェーズ 2）**: フェーズ 1 の完了に依存 — 契約・基盤が整備されていること
- **US2（フェーズ 3）**: フェーズ 1 の完了に依存 — US1 とは独立して開始可能だが、`ProductCard` を共有するため US1 完了後が推奨
- **US3（フェーズ 4）**: フェーズ 1 の完了に依存 — `keyword` のリポジトリ実装はフェーズ 1 で完了済み。`ProductList` の検索バー統合があるため US1 完了後が推奨
- **E2E・品質検証（フェーズ 5）**: すべてのユーザーストーリーの完了に依存

### ユーザーストーリー依存関係

- **US1（P1）**: フェーズ 1 完了後に開始可能。他のストーリーへの依存なし
- **US2（P2）**: フェーズ 1 完了後に開始可能。US1 の `ProductCard` と `index.tsx` エクスポートを使用するため、T012〜T014 完了後が効率的
- **US3（P3）**: フェーズ 1 完了後に開始可能。US1 の `ProductList` を拡張するため、T013〜T014 完了後が効率的

### 各ユーザーストーリー内の実行順序

1. テスト作成（Red） → 失敗確認
2. 実装（Green） → テスト通過確認
3. リファクタリング（必要に応じて）

### 並列実行の機会

- フェーズ 1 内: T001 と T002 は同一ファイルだが順次実行。T003〜T005 は異なるファイルなので T001-T002 完了後に並列可能
- フェーズ 2 テスト: T007, T008, T009, T010 はすべて異なるファイル/セクションなので並列実行可能
- フェーズ 2 実装: T012, T013 は異なるファイルなので並列実行可能
- フェーズ 3 テスト: T019, T020, T021 は並列実行可能
- フェーズ 4 テスト: T027, T028, T029 は並列実行可能

---

## 並列実行例: ユーザーストーリー 1

```bash
# US1 のテストを並列で作成（Red フェーズ）:
タスク: "T007 getProducts ユースケーステストを tests/unit/domains/catalog/usecase.test.ts に作成"
タスク: "T008 ProductCard コンポーネントテストを tests/unit/domains/catalog/ui.test.tsx に作成"
タスク: "T009 ProductList コンポーネントテストを tests/unit/domains/catalog/ui.test.tsx に作成"
タスク: "T010 getProducts 統合テストを tests/integration/domains/catalog/api.test.ts に作成"

# US1 の UI コンポーネントを並列で作成（Green フェーズ）:
タスク: "T012 ProductCard を src/domains/catalog/ui/ProductCard.tsx に作成"
タスク: "T013 ProductList を src/domains/catalog/ui/ProductList.tsx に作成"
```

---

## 実装戦略

### MVP ファースト（ユーザーストーリー 1 のみ）

1. フェーズ 1 完了: セットアップ（契約・基盤変更）
2. フェーズ 2 完了: ユーザーストーリー 1（商品一覧表示）
3. **停止して検証**: 商品一覧の閲覧が独立して動作するか確認
4. デプロイ/デモ可能な状態

### インクリメンタルデリバリー

1. フェーズ 1 完了 → 契約・基盤が整備された状態
2. US1 追加 → 独立テスト → デプロイ/デモ（MVP！）
3. US2 追加 → 独立テスト → デプロイ/デモ（商品詳細が追加）
4. US3 追加 → 独立テスト → デプロイ/デモ（検索機能が追加）
5. E2E テスト・品質検証 → 最終リリース

### 推奨実行順序（単独開発者の場合）

```
T001 → T002 → T003 → T004 → T005 → T006（フェーズ 1 完了）
→ T007〜T010（US1 テスト Red）→ T011〜T017（US1 実装 Green）→ T018（確認）
→ T019〜T021（US2 テスト Red）→ T022〜T025（US2 実装 Green）→ T026（確認）
→ T027〜T029（US3 テスト Red）→ T030〜T031（US3 実装 Green）→ T032（確認）
→ T033〜T037（E2E・品質検証）
```

---

## 備考

- [P] タスク = 異なるファイル、依存関係なし
- [Story] ラベル = 特定のユーザーストーリーへのトレーサビリティ
- 各ユーザーストーリーは独立して完了・テスト可能
- テストが失敗することを確認してから実装に着手する（Red → Green → Refactor）
- 各タスクまたは論理グループ完了後にコミットする
- 任意のチェックポイントで停止してストーリーを独立検証可能
