# タスク: カート管理

**入力**: `specs/002-cart-management/` のデザインドキュメント
**前提**: plan.md（必須）、spec.md（必須）、research.md、data-model.md、contracts/

**テスト**: TDD（Red → Green → Refactor）アプローチ。各ユーザーストーリーにテストタスクを含む。

**構成**: ユーザーストーリー単位でフェーズを分割し、各ストーリーを独立して実装・テスト可能にする。

## フォーマット: `[ID] [P?] [Story] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存なし）
- **[Story]**: ユーザーストーリーラベル（US1, US2, US3, US4, US5）
- ファイルパスは正確に記載

---

## Phase 1: セットアップ（共有インフラ）

**目的**: テストディレクトリ構造の準備と既存コントラクトの確認

- [ ] T001 テストディレクトリ構造を作成: `tests/unit/domains/cart/`、`tests/integration/domains/cart/`、`tests/e2e/cart/`
- [ ] T002 既存コントラクト `src/contracts/cart.ts` のスキーマ（CartSchema, CartItemSchema, 入出力スキーマ）が仕様を満たすことを確認

**チェックポイント**: テストディレクトリが存在し、既存コントラクトが要件を網羅していることを確認

---

## Phase 2: 基盤（全ストーリーの前提）

**目的**: コントラクトバリデーションテストとリポジトリ統合テスト

**⚠️ 重要**: 全ユーザーストーリーの実装前に完了すること

### テスト（Red フェーズ）

- [ ] T003 [P] コントラクトバリデーションテストを作成: `tests/unit/domains/cart/usecases.test.ts` — CartItemSchema（productId, quantity, price）、AddToCartInputSchema（productId必須, quantity範囲）、UpdateCartItemInputSchema（quantity 1〜99）のバリデーションテスト
- [ ] T004 [P] リポジトリ統合テストを作成: `tests/integration/domains/cart/api.test.ts` — CartRepository の find/create/addItem/updateItemQuantity/removeItem の基本動作テスト

### 実装（Green フェーズ）

- [ ] T005 テスト T003, T004 の Red 確認後、既存リポジトリ `src/infrastructure/repositories/cart.ts` の動作を確認し、テストがすべてパスすることを検証

**チェックポイント**: コントラクトバリデーション・リポジトリ統合テストがすべてパス。基盤準備完了

---

## Phase 3: ユーザーストーリー 1 — カートに商品を追加（優先度: P1）🎯 MVP

**目標**: 購入者が商品詳細ページから「カートに追加」ボタンで商品をカートに追加できる。同一商品は数量増加、在庫切れは無効化、二重送信防止、成功フィードバック表示

**独立テスト**: 商品詳細ページで「カートに追加」→ 成功メッセージ表示 → ヘッダーのカート件数更新を確認

### テスト（Red フェーズ）

- [ ] T006 [P] [US1] addToCart ユースケース単体テストを作成: `tests/unit/domains/cart/usecases.test.ts` — 商品追加（正常系）、同一商品の数量増加、存在しない商品でエラー、在庫切れ商品でエラーのテスト
- [ ] T007 [P] [US1] POST `/api/cart/items` 統合テストを作成: `tests/integration/domains/cart/api.test.ts` — 商品追加API呼び出し（200返却）、カート内の商品数・小計の検証、エラーケース（404, 400）
- [ ] T008 [P] [US1] 商品詳細ページ「カートに追加」ボタンE2Eテストを作成: `tests/e2e/cart/buyer-cart.spec.ts` — 詳細ページで追加ボタンクリック → 成功メッセージ表示、ヘッダーカート件数更新、在庫切れ商品でボタン無効

### 実装（Green フェーズ）

- [ ] T009 [US1] カート用型定義を作成: `src/domains/cart/types/index.ts` — TaxCalculation インターフェース（subtotal, tax, total）、消費税計算ユーティリティ関数 `calculateTax(subtotal)`
- [ ] T010 [US1] addToCart 本番ユースケースを作成: `src/domains/cart/api/usecases.ts` — `src/contracts/cart.ts` の CartRepository・ProductFetcher インターフェースに準拠。入力バリデーション、商品存在・在庫チェック、同一商品数量加算ロジックを実装
- [ ] T011 [US1] `src/domains/cart/api/index.ts` を更新: samples の再エクスポートから本番 usecases のエクスポートに切り替え（addToCart, getCart）
- [ ] T012 [US1] 商品詳細ページにカート追加ロジックを統合: `src/app/(buyer)/catalog/[id]/page.tsx` — `onAddToCart` コールバックで POST `/api/cart/items` を呼び出し、成功時に `dispatchCartUpdated()` 発火、二重送信防止（loading 状態管理）、成功メッセージ表示

**チェックポイント**: 商品詳細ページからカートに追加でき、ヘッダーのカート件数が更新される。T006〜T008 のテストがすべてパス

---

## Phase 4: ユーザーストーリー 2 — カート内容の確認（優先度: P2）

**目標**: カートページで商品一覧（画像・名前・単価・数量・小計）と合計金額（商品合計・消費税10%端数切り捨て・総合計）を表示。空カートではメッセージと商品一覧リンクを表示

**独立テスト**: カートに商品を追加後、カートページで商品情報と正しい合計金額（消費税含む）を確認

### テスト（Red フェーズ）

- [ ] T013 [P] [US2] getCart ユースケース単体テストを作成: `tests/unit/domains/cart/usecases.test.ts` — カート取得（商品あり）、空カート自動作成、アイテム情報（productName, price, quantity）の検証
- [ ] T014 [P] [US2] CartView・CartItem・CartSummary コンポーネント単体テストを作成: `tests/unit/domains/cart/components.test.tsx` — カートアイテム行の表示（画像・名前・単価・数量・小計）、合計セクション（商品合計・消費税・総合計）、空カートメッセージと商品一覧リンク表示
- [ ] T015 [P] [US2] カートページE2Eテストを作成: `tests/e2e/cart/buyer-cart.spec.ts` — カートページで商品一覧表示、合計金額の検証、空カートのメッセージ表示

### 実装（Green フェーズ）

- [ ] T016 [US2] getCart 本番ユースケースを作成: `src/domains/cart/api/usecases.ts` に追加 — カート取得、未作成時の空カート自動作成
- [ ] T017 [P] [US2] CartItem コンポーネントを作成: `src/domains/cart/ui/CartItem.tsx` — 商品画像・名前・単価・数量・小計を表示。数量変更・削除のコールバック props を受け取る（Phase 5, 6 で実装）
- [ ] T018 [P] [US2] CartSummary コンポーネントを作成: `src/domains/cart/ui/CartSummary.tsx` — 商品合計・消費税（`Math.floor(subtotal * 0.1)`）・総合計を表示
- [ ] T019 [US2] CartView コンポーネントを作成: `src/domains/cart/ui/CartView.tsx` — CartItem と CartSummary を組み合わせ。Loading/Error/Empty 状態対応。空カート時に「カートに商品がありません」メッセージと商品一覧リンクを表示
- [ ] T020 [US2] `src/domains/cart/ui/index.ts` を更新: samples の再エクスポートから本番コンポーネントのエクスポートに切り替え（CartView, CartItem, CartSummary）
- [ ] T021 [US2] カートページを更新: `src/app/(buyer)/cart/page.tsx` — GET `/api/cart` からデータ取得、CartView に渡して表示

**チェックポイント**: カートページで商品一覧と正しい合計金額（消費税含む）が表示される。T013〜T015 のテストがすべてパス

---

## Phase 5: ユーザーストーリー 3 — 数量変更（優先度: P3）

**目標**: カート内の商品数量を1〜99の範囲かつ在庫数以下で変更でき、小計・合計が即時更新される

**独立テスト**: カートページで数量を変更し、小計と合計が即時に再計算されることを確認

### テスト（Red フェーズ）

- [ ] T022 [P] [US3] updateCartItem ユースケース単体テストを作成: `tests/unit/domains/cart/usecases.test.ts` — 数量変更（正常系）、範囲外（0, 100）でエラー、在庫超過でエラー、存在しないアイテムでエラー
- [ ] T023 [P] [US3] 数量変更UI統合テストを作成: `tests/unit/domains/cart/components.test.tsx` — CartItem の数量変更コールバック呼び出し、在庫超過時のエラーメッセージ表示
- [ ] T024 [P] [US3] 数量変更E2Eテストを作成: `tests/e2e/cart/buyer-cart.spec.ts` — カートページで数量変更 → 小計・合計の即時更新確認

### 実装（Green フェーズ）

- [ ] T025 [US3] updateCartItem 本番ユースケースを作成: `src/domains/cart/api/usecases.ts` に追加 — 数量バリデーション（1〜99、在庫数以下）、エラーメッセージ返却
- [ ] T026 [US3] `src/domains/cart/api/index.ts` に updateCartItem を追加エクスポート
- [ ] T027 [US3] CartItem コンポーネントに数量変更機能を実装: `src/domains/cart/ui/CartItem.tsx` — QuantitySelector テンプレート使用、`onUpdateQuantity` コールバック、在庫超過時エラーメッセージ表示
- [ ] T028 [US3] カートページに数量変更ハンドラを実装: `src/app/(buyer)/cart/page.tsx` — PUT `/api/cart/items/[productId]` 呼び出し、`cart-updated` イベント発火、即時再描画

**チェックポイント**: カートページで数量変更すると小計・合計が即時更新される。T022〜T024 のテストがすべてパス

---

## Phase 6: ユーザーストーリー 4 — 商品の削除（優先度: P4）

**目標**: カートから商品を削除できる。削除前に確認ダイアログを表示。最後の商品削除で空状態メッセージを表示

**独立テスト**: カートページで削除ボタン → 確認ダイアログ → 削除実行 → 商品が消え合計が再計算されることを確認

### テスト（Red フェーズ）

- [ ] T029 [P] [US4] removeFromCart ユースケース単体テストを作成: `tests/unit/domains/cart/usecases.test.ts` — 商品削除（正常系）、存在しないアイテムでエラー
- [ ] T030 [P] [US4] 削除UI・確認ダイアログ統合テストを作成: `tests/unit/domains/cart/components.test.tsx` — 削除ボタンクリックで確認ダイアログ表示、「削除する」で `onRemove` コールバック呼び出し、「キャンセル」で何も起きない
- [ ] T031 [P] [US4] 商品削除E2Eテストを作成: `tests/e2e/cart/buyer-cart.spec.ts` — 削除ボタン → 確認ダイアログ → 削除実行 → 商品消去確認、最後の商品削除で空状態メッセージ表示

### 実装（Green フェーズ）

- [ ] T032 [US4] removeFromCart 本番ユースケースを作成: `src/domains/cart/api/usecases.ts` に追加
- [ ] T033 [US4] `src/domains/cart/api/index.ts` に removeFromCart を追加エクスポート
- [ ] T034 [US4] CartItem コンポーネントに削除ボタンを実装: `src/domains/cart/ui/CartItem.tsx` — 削除ボタン表示、`onRemove` コールバック
- [ ] T035 [US4] CartView に確認ダイアログを統合: `src/domains/cart/ui/CartView.tsx` — ConfirmDialog テンプレート使用（variant='danger'）、削除確認後にコールバック実行
- [ ] T036 [US4] カートページに削除ハンドラを実装: `src/app/(buyer)/cart/page.tsx` — DELETE `/api/cart/items/[productId]` 呼び出し、`cart-updated` イベント発火、即時再描画

**チェックポイント**: 確認ダイアログ経由で商品を削除でき、最後の商品を削除すると空状態メッセージが表示される。T029〜T031 のテストがすべてパス

---

## Phase 7: ユーザーストーリー 5 — カート内容の永続化（優先度: P5）

**目標**: カートの内容がページ遷移やブラウザリロード後も保持される

**独立テスト**: カートに商品を追加後、ページ遷移・リロードしてカートの内容が保持されていることを確認

### テスト（Red フェーズ）

- [ ] T037 [P] [US5] カート永続化E2Eテストを作成: `tests/e2e/cart/buyer-cart.spec.ts` — 商品追加 → ページ遷移 → カートページに戻る → 内容保持確認、商品追加 → リロード → 内容保持確認

### 実装（Green フェーズ）

- [ ] T038 [US5] カート永続化の検証と修正: インメモリリポジトリ `src/infrastructure/repositories/cart.ts` の `globalThis.__cartStore` がページ遷移・リロードで保持されることを確認。問題があれば修正

**チェックポイント**: ページ遷移・リロード後もカート内容が保持される。T037 のテストがパス

---

## Phase 8: ナビゲーション & 最終検証

**目的**: ナビゲーションリンク追加、全テスト実行、カバレッジ確認

- [ ] T039 購入者レイアウトの navLinks にカートリンクを追加: `src/app/(buyer)/layout.tsx` — `{ href: '/cart', label: 'カート' }` をコメント解除して追加
- [ ] T040 ナビゲーションE2Eテストを追加: `tests/e2e/cart/buyer-cart.spec.ts` — ヘッダーに「カート」リンクが表示され、クリックで `/cart` に遷移すること
- [ ] T041 全テストスイートを実行し、すべてパスすることを確認（vitest + playwright）
- [ ] T042 TypeScript コンパイルエラーが0件であることを確認
- [ ] T043 テストカバレッジが80%以上であることを確認

**チェックポイント**: 全テストパス、TypeScript エラー0件、カバレッジ80%以上

---

## 依存関係 & 実行順序

### フェーズ依存関係

- **セットアップ（Phase 1）**: 依存なし — 即座に開始可能
- **基盤（Phase 2）**: セットアップ完了後 — 全ストーリーをブロック
- **US1（Phase 3）**: 基盤完了後 — 他ストーリーへの依存なし
- **US2（Phase 4）**: 基盤完了後 — US1 の addToCart が利用可能であること（テストデータ準備のため）
- **US3（Phase 5）**: US2 完了後 — CartItem コンポーネントが存在すること
- **US4（Phase 6）**: US2 完了後 — CartView コンポーネントが存在すること
- **US5（Phase 7）**: US1 完了後 — カート追加機能が動作すること
- **最終検証（Phase 8）**: 全ストーリー完了後

### ユーザーストーリー依存関係

- **US1（カート追加）**: 基盤のみに依存。他ストーリーの前提
- **US2（内容確認）**: US1 のユースケースに依存（getCart）
- **US3（数量変更）**: US2 の CartItem コンポーネントに依存
- **US4（商品削除）**: US2 の CartView コンポーネントに依存
- **US5（永続化）**: US1 のカート追加機能に依存

### 各ストーリー内の順序

1. テストを作成し、失敗を確認する（Red）
2. 最小限の実装でテストを通す（Green）
3. リファクタリングを行う（Refactor）

### 並列実行の機会

- Phase 2: T003 と T004 は並列実行可能
- Phase 3: T006, T007, T008 は並列実行可能
- Phase 4: T013, T014, T015 は並列実行可能。T017 と T018 も並列実行可能
- Phase 5: T022, T023, T024 は並列実行可能
- Phase 6: T029, T030, T031 は並列実行可能

---

## 並列実行例: ユーザーストーリー 1

```text
# US1 のテストを並列に作成（Red フェーズ）:
タスク: "T006 addToCart ユースケース単体テスト"
タスク: "T007 POST /api/cart/items 統合テスト"
タスク: "T008 カートに追加 E2E テスト"

# Red 確認後、実装を順次実行（Green フェーズ）:
タスク: "T009 カート用型定義作成"
タスク: "T010 addToCart 本番ユースケース作成"
タスク: "T011 api/index.ts 更新"
タスク: "T012 商品詳細ページ統合"
```

---

## 実装戦略

### MVP ファースト（US1 のみ）

1. Phase 1: セットアップ完了
2. Phase 2: 基盤完了（全ストーリーのブロック解除）
3. Phase 3: US1 完了（カート追加が動作）
4. **検証**: 商品詳細ページからカートに追加できることを確認
5. MVP としてデモ可能

### 段階的デリバリー

1. セットアップ + 基盤 → 基盤準備完了
2. US1 追加 → テスト → MVP（カート追加）
3. US2 追加 → テスト → カート表示（合計・消費税）
4. US3 追加 → テスト → 数量変更
5. US4 追加 → テスト → 商品削除（確認ダイアログ）
6. US5 追加 → テスト → 永続化
7. 最終検証 → ナビゲーション + 全テスト

---

## 備考

- [P] タスク = 異なるファイル、依存なし → 並列実行可能
- [Story] ラベル = ユーザーストーリーとの対応を明示
- 各ストーリーは独立して完成・テスト可能
- テストは必ず失敗を確認してから実装する（Red → Green → Refactor）
- 論理的なグループごとにコミット
- 各チェックポイントでストーリーを独立検証可能
