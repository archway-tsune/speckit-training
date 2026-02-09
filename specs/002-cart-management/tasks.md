# タスク一覧: カート管理機能

**入力**: `specs/002-cart-management/` の設計ドキュメント群
**前提**: plan.md（必須）、spec.md（必須）、research.md、data-model.md、contracts/

**テスト**: TDD アプローチ — 各ユースケースにテストタスクを含め、Red → Green → Refactor を徹底する。

**構成**: ユーザーストーリー単位でフェーズを分割し、各ストーリーを独立して実装・テスト可能にする。

## フォーマット: `[ID] [P?] [Story] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: 所属するユーザーストーリー（US1, US2, US3 等）
- 説明に正確なファイルパスを含める

---

## Phase 1: セットアップ（共有基盤）

**目的**: 全ユーザーストーリーに必要なテストディレクトリ構成と契約変更

- [x] T001 テストディレクトリを作成する `tests/unit/domains/cart/` `tests/integration/domains/cart/` `tests/e2e/cart/`
- [x] T002 `src/contracts/cart.ts` の `ProductFetcher` インターフェースに `stock: number` フィールドを追加する（`findById()` の返り値を `{ id, name, price, imageUrl?, stock }` に変更）
- [x] T003 `src/infrastructure/repositories/cart.ts` の `productFetcher` 実装を更新し、`stock` フィールドを返すようにする
- [x] T004 `src/samples/domains/cart/api/usecases.ts` 等のサンプルコードが `ProductFetcher` の `stock` 追加後も正常にコンパイルできることを確認し、必要に応じて修正する

**チェックポイント**: 契約変更が完了し、既存テストが全て通ること

---

## Phase 2: 基盤（ブロッキング前提条件）

**目的**: 全ユーザーストーリーが依存するドメイン API の本番実装

**⚠️ 重要**: このフェーズが完了するまでユーザーストーリーの実装に着手できない

### テスト（Red フェーズ）

- [x] T005 [P] `getCart` ユースケースの単体テストを作成する `tests/unit/domains/cart/usecase.test.ts` — buyer 認証チェック、既存カート返却、カート未存在時の自動作成をテスト（`src/samples/tests/unit/domains/cart/usecase.test.ts` を参考）
- [x] T006 [P] `addToCart` ユースケースの単体テストを作成する `tests/unit/domains/cart/usecase.test.ts` — 商品追加、同一商品の数量加算、商品未存在エラー、在庫切れエラー、在庫超過エラーをテスト
- [x] T007 [P] `updateCartItem` ユースケースの単体テストを作成する `tests/unit/domains/cart/usecase.test.ts` — 数量更新成功、カートアイテム未存在エラー、在庫超過エラーをテスト
- [x] T008 [P] `removeFromCart` ユースケースの単体テストを作成する `tests/unit/domains/cart/usecase.test.ts` — 削除成功、カートアイテム未存在エラーをテスト
- [x] T009 テストが失敗すること（Red）を確認する — `npx vitest run tests/unit/domains/cart/usecase.test.ts`

### 実装（Green フェーズ）

- [x] T010 `src/domains/cart/api/index.ts` のスタブを本番ユースケース実装に置き換える — `CartContext` 型定義、`NotFoundError`/`CartItemNotFoundError` エラークラス、`getCart`/`addToCart`/`updateCartItem`/`removeFromCart` ユースケースを実装する（`src/samples/domains/cart/api/usecases.ts` を参考に、在庫チェックロジックを追加）
- [x] T011 テストが成功すること（Green）を確認する — `npx vitest run tests/unit/domains/cart/usecase.test.ts`
- [x] T012 リファクタリングの要否を確認する（Refactor フェーズ）

### API 統合テスト

- [x] T013 カート API の統合テストを作成する `tests/integration/domains/cart/api.test.ts` — 契約スキーマとの整合性検証（`GetCartOutputSchema`、`AddToCartOutputSchema` 等の Zod パース成功を確認）（`src/samples/tests/integration/domains/cart/api.test.ts` を参考）
- [x] T014 統合テストが失敗すること（Red）を確認し、必要に応じてドメイン API を修正して成功させる（Green）

**チェックポイント**: ドメイン API の全ユースケースが単体テスト・統合テストを通過すること

---

## Phase 3: ユーザーストーリー 1 — カートに商品を追加する（優先度: P1）🎯 MVP

**目標**: 購入者が商品詳細ページから「カートに追加」ボタンで商品をカートに入れ、成功フィードバックを受け取り、ヘッダーのカート件数が更新される

**独立テスト**: 商品詳細ページでカート追加ボタンを押し、成功フィードバックが表示されること、ヘッダーのカートアイコン件数が更新されることを確認。同一商品の再追加で数量増加を検証。

### テスト（Red フェーズ）

- [x] T015 [P] [US1] 商品詳細ページの「カートに追加」ボタン UI テストを作成する `tests/unit/domains/cart/ui.test.tsx` — ボタン表示、在庫切れ時の disabled 状態、クリック時の API 呼び出し、成功フィードバック表示、二重送信防止をテスト
- [x] T016 [US1] テストが失敗すること（Red）を確認する — `npx vitest run tests/unit/domains/cart/ui.test.tsx`

### 実装（Green フェーズ）

- [x] T017 [US1] 商品詳細ページ `src/app/(buyer)/catalog/[id]/page.tsx` に「カートに追加」ボタンを追加する — 在庫切れ時は disabled、送信中は disabled（二重送信防止）、成功時にインラインフィードバック表示、`cart-updated` カスタムイベントを発火してヘッダーのカート件数を更新、未ログイン時は `/login?redirect=/catalog/{id}` にリダイレクト
- [x] T018 [US1] テストが成功すること（Green）を確認する — `npx vitest run tests/unit/domains/cart/ui.test.tsx`
- [x] T019 [US1] リファクタリングの要否を確認する（Refactor フェーズ）

**チェックポイント**: 商品詳細ページからカート追加が動作し、US1 の全受入シナリオを満たすこと

---

## Phase 4: ユーザーストーリー 2 — カート内容を確認する（優先度: P2）

**目標**: カートページで商品一覧（画像・名前・単価・数量・小計）と金額明細（商品合計・消費税・総合計）を表示する

**独立テスト**: カートに商品を追加後、カートページにアクセスし、商品一覧と金額明細が正しく表示されることを確認。空カートでは「カートに商品がありません」メッセージと商品一覧への導線が表示されることを検証。

### テスト（Red フェーズ）

- [x] T020 [P] [US2] CartView コンポーネントの UI テストを作成する `tests/unit/domains/cart/ui.test.tsx` — カート一覧表示（商品画像・名前・単価・数量・小計）、金額計算（商品合計・消費税 `Math.floor(subtotal * 0.1)`・総合計）、空カート時のメッセージ・商品一覧リンク表示、ローディング状態、エラー状態をテスト
- [x] T021 [US2] テストが失敗すること（Red）を確認する — `npx vitest run tests/unit/domains/cart/ui.test.tsx`

### 実装（Green フェーズ）

- [x] T022 [US2] `src/domains/cart/ui/index.tsx` のプレースホルダーを CartView 本番実装に置き換える — `src/samples/domains/cart/ui/CartView.tsx` を参考に、カート一覧表示（画像・名前・単価・数量・小計）、金額明細（商品合計・消費税・総合計）、空カート時のメッセージ（「カートに商品がありません」）+ 商品一覧ページリンク、ローディング・エラー状態を実装する。消費税は UI レイヤーで `Math.floor(subtotal * 0.1)` で計算する。`/api/cart` から GET でカートデータを取得するデータフェッチロジックを含める
- [x] T023 [US2] テストが成功すること（Green）を確認する — `npx vitest run tests/unit/domains/cart/ui.test.tsx`
- [x] T024 [US2] リファクタリングの要否を確認する（Refactor フェーズ）

### ナビゲーション更新

- [x] T025 [US2] `src/app/(buyer)/layout.tsx` の navLinks でカートリンク `{ href: '/cart', label: 'カート' }` をコメント解除する。`cartUrl` も `'/cart'` に更新する。spec.md スコープ外のリンクが含まれていないか監査する（注文履歴リンクはコメントアウトのまま維持）

**チェックポイント**: カートページで商品一覧と金額明細が正しく表示され、ヘッダーのカートリンクからカートページに遷移できること

---

## Phase 5: ユーザーストーリー 3 — カート内の数量を変更する（優先度: P3）

**目標**: カートページで商品の数量を 1〜99 の範囲で変更し、小計と合計金額が即時更新される

**独立テスト**: カートページで数量を変更し、小計・合計が即時更新されることを確認。在庫超過や範囲外の数量で適切なエラーが表示されることを検証。

### テスト（Red フェーズ）

- [x] T026 [P] [US3] 数量変更 UI テストを作成する `tests/unit/domains/cart/ui.test.tsx` — 数量セレクターの表示、数量変更時の API 呼び出し（PUT /api/cart/items/:productId）、変更後の小計・合計即時更新、在庫超過エラーメッセージ「在庫数を超えています」の表示をテスト
- [x] T027 [US3] テストが失敗すること（Red）を確認する — `npx vitest run tests/unit/domains/cart/ui.test.tsx`

### 実装（Green フェーズ）

- [x] T028 [US3] CartView コンポーネント `src/domains/cart/ui/index.tsx` に数量変更機能を追加する — QuantitySelector（数量 1〜99）を使用、PUT /api/cart/items/:productId で数量更新 API を呼び出し、成功時にカートデータを再取得して小計・合計を即時更新、在庫超過時にエラーメッセージ「在庫数を超えています」を表示
- [x] T029 [US3] テストが成功すること（Green）を確認する — `npx vitest run tests/unit/domains/cart/ui.test.tsx`
- [x] T030 [US3] リファクタリングの要否を確認する（Refactor フェーズ）

**チェックポイント**: カートページで数量変更が動作し、小計・合計が即時更新され、在庫超過時にエラーが表示されること

---

## Phase 6: ユーザーストーリー 4 — カートから商品を削除する（優先度: P4）

**目標**: カートから商品を削除する前に確認ダイアログを表示し、確認後にのみ削除を実行する

**独立テスト**: 削除ボタンで確認ダイアログが表示され、確認後に商品が削除されること。キャンセルで状態が変わらないこと。最後の商品削除で空状態になることを検証。

### テスト（Red フェーズ）

- [x] T031 [P] [US4] 商品削除 UI テストを作成する `tests/unit/domains/cart/ui.test.tsx` — 削除ボタンクリックで ConfirmDialog 表示、「削除する」選択時に DELETE API 呼び出し、「キャンセル」選択時に状態不変、最後の商品削除で空カートメッセージ表示をテスト
- [x] T032 [US4] テストが失敗すること（Red）を確認する — `npx vitest run tests/unit/domains/cart/ui.test.tsx`

### 実装（Green フェーズ）

- [x] T033 [US4] CartView コンポーネント `src/domains/cart/ui/index.tsx` に商品削除機能を追加する — 削除ボタンクリック時に `src/templates/ui/components/dialog/ConfirmDialog.tsx` テンプレートを使用して確認ダイアログを表示、「削除する」選択時に DELETE /api/cart/items/:productId で API 呼び出し、カートデータを再取得して合計更新、最後の商品削除で空カート状態を表示
- [x] T034 [US4] テストが成功すること（Green）を確認する — `npx vitest run tests/unit/domains/cart/ui.test.tsx`
- [x] T035 [US4] リファクタリングの要否を確認する（Refactor フェーズ）

**チェックポイント**: 確認ダイアログ付きの商品削除が動作し、キャンセル時は状態不変、最後の商品削除で空カート表示になること

---

## Phase 7: ユーザーストーリー 5 — カート内容の永続化（優先度: P5）

**目標**: カート内容がページ遷移やブラウザリロード後も保持される

**独立テスト**: カートに商品を追加後、ページ遷移・リロード後にカート内容が維持されていることを確認する。

- [x] T036 [US5] カート永続化の E2E テストを作成する `tests/e2e/cart/buyer-flow.spec.ts` — 購入者ログイン → 商品をカートに追加 → カートページで内容確認 → ページ遷移（商品一覧へ）→ カートページに戻り内容保持を確認 → ブラウザリロード → 内容保持を確認
- [x] T037 [US5] テストが失敗すること（Red）を確認する — `npx playwright test tests/e2e/cart/buyer-flow.spec.ts`
- [x] T038 [US5] 永続化はサーバーサイドのインメモリストア（`src/infrastructure/repositories/cart.ts`）で既に実現されているため、カートページのデータフェッチが毎回 `/api/cart` から取得していることを確認する。E2E テストが成功すること（Green）を確認する
- [x] T039 [US5] リファクタリングの要否を確認する（Refactor フェーズ）

**チェックポイント**: ページ遷移・リロード後もカート内容が保持されること

---

## Phase 8: ポリッシュ＆横断的関心事

**目的**: 全ユーザーストーリーに跨る品質確保

### E2E テスト

- [x] T040 カート管理の E2E テストを拡充する `tests/e2e/cart/buyer-flow.spec.ts` — カート追加 → 内容確認 → 数量変更 → 商品削除 → 空カート表示の一連フローをテスト。在庫切れ商品のボタン無効化、未ログイン時のリダイレクト、同一商品再追加による数量加算もテスト
- [x] T041 E2E テストが全て成功することを確認する — `npx playwright test tests/e2e/cart/`

### 品質チェック

- [x] T042 TypeScript コンパイルエラーが 0 件であることを確認する — `npx tsc --noEmit`
- [x] T043 ESLint エラーが 0 件であることを確認する — `npx eslint src/domains/cart/ src/app/\\(buyer\\)/cart/ src/app/\\(buyer\\)/catalog/ src/app/api/cart/ tests/unit/domains/cart/ tests/integration/domains/cart/ tests/e2e/cart/`

**チェックポイント**: 全テスト（単体・統合・E2E）が通過し、TypeScript + ESLint エラーが 0 件であること

---

## 依存関係と実行順序

### フェーズ依存関係

- **セットアップ（Phase 1）**: 依存なし — 即時開始可能
- **基盤（Phase 2）**: Phase 1 の完了に依存 — 全ユーザーストーリーをブロック
- **US1（Phase 3）**: Phase 2 の完了に依存 — 他のストーリーへの依存なし
- **US2（Phase 4）**: Phase 2 の完了に依存 — US1 と並列実行可能（ただし US1 で追加した商品を表示するため、統合テストは US1 完了後が望ましい）
- **US3（Phase 5）**: Phase 4 の完了に依存（CartView に数量変更を追加するため）
- **US4（Phase 6）**: Phase 4 の完了に依存（CartView に削除機能を追加するため）。US3 とは並列実行可能
- **US5（Phase 7）**: Phase 3〜6 の完了に依存（全 CRUD 操作が動作することが前提）
- **ポリッシュ（Phase 8）**: 全ユーザーストーリー完了後

### 各ユーザーストーリー内の実行順序

1. テスト作成（Red フェーズ）→ テスト失敗確認
2. 実装（Green フェーズ）→ テスト成功確認
3. リファクタリング要否確認（Refactor フェーズ）

### 並列実行の機会

- Phase 2: T005, T006, T007, T008 のユースケーステストは並列作成可能
- Phase 3〜6: 各ストーリーの Red フェーズ内のテスト作成は並列可能
- Phase 5 と Phase 6: US3 と US4 は CartView 内の異なる機能であり、並列実行可能（ただし同一ファイル `src/domains/cart/ui/index.tsx` に変更を加えるため、マージ時に注意）

---

## 並列実行例: Phase 2（基盤テスト）

```bash
# 全ユースケーステストを並列作成:
Task: "getCart 単体テスト作成 tests/unit/domains/cart/usecase.test.ts"
Task: "addToCart 単体テスト作成 tests/unit/domains/cart/usecase.test.ts"
Task: "updateCartItem 単体テスト作成 tests/unit/domains/cart/usecase.test.ts"
Task: "removeFromCart 単体テスト作成 tests/unit/domains/cart/usecase.test.ts"
```

---

## 実装戦略

### MVP ファースト（ユーザーストーリー 1 のみ）

1. Phase 1: セットアップ完了
2. Phase 2: 基盤完了（ドメイン API テスト + 実装）
3. Phase 3: US1 完了（カート追加）
4. **停止＆検証**: US1 を独立してテスト
5. デモ/デプロイ可能

### インクリメンタルデリバリー

1. セットアップ + 基盤 → 基盤準備完了
2. US1 追加 → 独立テスト → デモ（MVP!）
3. US2 追加 → 独立テスト → デモ（カート表示）
4. US3 追加 → 独立テスト → デモ（数量変更）
5. US4 追加 → 独立テスト → デモ（商品削除）
6. US5 追加 → 独立テスト → デモ（永続化確認）
7. ポリッシュ → 最終検証 → リリース

---

## 備考

- [P] タスク = 異なるファイル、依存関係なし
- [Story] ラベル = 特定のユーザーストーリーへのトレーサビリティ
- 各ユーザーストーリーは独立して完了・テスト可能
- テスト失敗を確認してから実装に着手（Red → Green → Refactor）
- 各タスクまたは論理グループの完了後にコミット
- チェックポイントで各ストーリーを独立検証可能
