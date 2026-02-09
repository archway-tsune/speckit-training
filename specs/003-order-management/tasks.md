# タスク一覧: 注文機能

**入力**: `specs/003-order-management/` の設計ドキュメント群
**前提**: plan.md（必須）、spec.md（必須）、research.md、data-model.md、contracts/

**テスト**: TDD アプローチ — 各ユースケースにテストタスクを含め、Red → Green → Refactor を徹底する。

**構成**: ユーザーストーリー単位でフェーズを分割し、各ストーリーを独立して実装・テスト可能にする。

## フォーマット: `[ID] [P?] [Story] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: 所属するユーザーストーリー（US1, US2, US3 等）
- 説明に正確なファイルパスを含める

---

## Phase 1: セットアップ（共有基盤）

**目的**: テストディレクトリ作成、新規ページルートの準備

- [ ] T001 テストディレクトリを作成する `tests/unit/domains/orders/` `tests/integration/domains/orders/` `tests/e2e/orders/`
- [ ] T002 [P] チェックアウトページのルートを作成する `src/app/(buyer)/checkout/page.tsx`（最小限のプレースホルダー、`'use client'` + コンポーネント import）
- [ ] T003 [P] 注文完了ページのルートを作成する `src/app/(buyer)/order-complete/page.tsx`（最小限のプレースホルダー、`'use client'` + コンポーネント import）

**チェックポイント**: ディレクトリ構造と新規ルートが作成され、既存テストが全て通ること

---

## Phase 2: 基盤（ドメイン API ユースケース）

**目的**: `src/domains/orders/api/index.ts` のスタブを本番ユースケースに置換し、単体・統合テストで検証する

**⚠️ 重要**: 全ユーザーストーリーの UI 実装はこの Phase の完了に依存する

### テスト（Red フェーズ）

- [ ] T004 [P] 注文ユースケースの単体テストを作成する `tests/unit/domains/orders/usecase.test.ts` — getOrders（購入者は自分の注文のみ、管理者は全注文、ページネーション）、getOrderById（存在確認、他人の注文拒否）、createOrder（カートから注文作成、カートクリア、空カートエラー）、updateOrderStatus（正常遷移、無効遷移エラー、admin 認可）をテスト
- [ ] T005 テストが失敗すること（Red）を確認する — `npx vitest run tests/unit/domains/orders/usecase.test.ts`

### 実装（Green フェーズ）

- [ ] T006 `src/domains/orders/api/index.ts` のスタブを本番ユースケースに置換する — `src/samples/domains/orders/api/usecases.ts` を参考に、`src/contracts/orders.ts` のスキーマ（GetOrdersInputSchema, GetOrderByIdInputSchema, CreateOrderInputSchema, UpdateOrderStatusInputSchema）と `ValidStatusTransitions` を使用して 4 関数（getOrders, getOrderById, createOrder, updateOrderStatus）を実装する。`@/foundation/validation/runtime` の `validate()`、`@/foundation/auth/authorize` の `authorize()` を使用
- [ ] T007 テストが成功すること（Green）を確認する — `npx vitest run tests/unit/domains/orders/usecase.test.ts`
- [ ] T008 リファクタリングの要否を確認する（Refactor フェーズ）

### 統合テスト

- [ ] T009 [P] 注文 API の統合テストを作成する `tests/integration/domains/orders/api.test.ts` — 全 4 ユースケースの入出力スキーマ適合、バリデーションエラーメッセージ、ステータス遷移の正常系・異常系、エンドツーエンドシナリオ（注文作成→取得→ステータス更新）をテスト
- [ ] T010 統合テストが成功すること（Green）を確認する — `npx vitest run tests/integration/domains/orders/api.test.ts`

**チェックポイント**: 4 つのユースケースが全て動作し、単体テスト・統合テストが通ること

---

## Phase 3: ユーザーストーリー 1 — チェックアウトと注文確定（優先度: P1）🎯 MVP

**目標**: カートから注文を確定し、注文完了画面を表示する。注文後にカートが自動クリアされる。

**独立テスト**: カートに商品を追加 → 「注文手続きへ」ボタンからチェックアウト画面に遷移 → 「注文を確定」で注文作成 → 注文完了画面に注文 ID とお礼メッセージが表示される → カートが空になる

### テスト（Red フェーズ）

- [ ] T011 [P] [US1] チェックアウト UI テストを作成する `tests/unit/domains/orders/ui.test.tsx` — CheckoutView コンポーネント: カート内容（商品名・単価・数量・小計・合計）の表示、「注文を確定」ボタンの表示と POST /api/orders 呼び出し、二重送信防止（送信中ボタン無効化）、成功時に注文完了ページへの遷移、カートが空の場合のリダイレクトをテスト
- [ ] T012 [P] [US1] 注文完了 UI テストを作成する `tests/unit/domains/orders/ui.test.tsx` — OrderCompletePage コンポーネント: 注文 ID の表示、お礼メッセージの表示、商品一覧へのリンクをテスト
- [ ] T013 [P] [US1] カートページの「注文手続きへ」ボタンテストを作成する `tests/unit/domains/orders/ui.test.tsx` — カートに商品がある場合はボタン表示、カートが空の場合はボタン非表示をテスト
- [ ] T014 [US1] テストが失敗すること（Red）を確認する — `npx vitest run tests/unit/domains/orders/ui.test.tsx`

### 実装（Green フェーズ）

- [ ] T015 [US1] CheckoutView コンポーネントを実装する `src/domains/orders/ui/index.tsx` — GET /api/cart でカート内容を取得して表示（商品名・単価・数量・小計・合計金額）、「注文を確定」ボタンで POST /api/orders を呼び出し、成功時に `/order-complete?orderId={id}` へ遷移、送信中はボタン無効化、`cart-updated` イベント発火、カートが空の場合は `/cart` にリダイレクト
- [ ] T016 [US1] OrderCompletePage コンポーネントを実装する `src/domains/orders/ui/index.tsx` — クエリパラメータから注文 ID を取得して表示、お礼メッセージ「ご注文ありがとうございます」を表示、商品一覧へのリンクを表示
- [ ] T017 [US1] カートページ `src/domains/cart/ui/index.tsx` に「注文手続きへ」ボタンを追加する — カートに商品がある場合のみ表示、クリックで `/checkout` に遷移
- [ ] T018 [US1] チェックアウトページ `src/app/(buyer)/checkout/page.tsx` を CheckoutView コンポーネントで置換する
- [ ] T019 [US1] 注文完了ページ `src/app/(buyer)/order-complete/page.tsx` を OrderCompletePage コンポーネントで置換する
- [ ] T020 [US1] テストが成功すること（Green）を確認する — `npx vitest run tests/unit/domains/orders/ui.test.tsx`
- [ ] T021 [US1] リファクタリングの要否を確認する（Refactor フェーズ）

**チェックポイント**: カート→チェックアウト→注文確定→注文完了の 3 ステップフローが動作し、注文後にカートがクリアされること

---

## Phase 4: ユーザーストーリー 2 — 購入者の注文履歴・注文詳細（優先度: P2）

**目標**: 購入者が自分の注文を一覧・詳細で確認できる。他人の注文にはアクセスできない。

**独立テスト**: 注文作成済みの購入者でログインし、注文履歴ページで注文一覧（ID 先頭 8 桁・注文日・商品数・合計金額・ステータス）が表示されること、注文詳細ページで全情報が表示されること

### テスト（Red フェーズ）

- [ ] T022 [P] [US2] 注文一覧 UI テストを作成する `tests/unit/domains/orders/ui.test.tsx` — OrderList コンポーネント: 注文一覧の表示（ID 先頭 8 桁・注文日・商品数・合計金額・ステータスバッジ）、ページネーション（20 件/ページ）、空状態メッセージ「注文履歴がありません」、ローディング状態、エラー状態をテスト
- [ ] T023 [P] [US2] 注文詳細 UI テストを作成する `tests/unit/domains/orders/ui.test.tsx` — OrderDetail コンポーネント: 注文 ID・注文日時・ステータス・商品一覧（商品名・単価・数量・小計）・合計金額の表示、戻るボタンをテスト
- [ ] T024 [US2] テストが失敗すること（Red）を確認する — `npx vitest run tests/unit/domains/orders/ui.test.tsx`

### 実装（Green フェーズ）

- [ ] T025 [US2] OrderList コンポーネントを実装する `src/domains/orders/ui/index.tsx` — GET /api/orders でデータフェッチ内蔵、`src/samples/domains/orders/ui/OrderList.tsx` を参考にステータスバッジ（色分け: 保留中=黄、確認済み=青、発送済み=紫、配送完了=緑、キャンセル=赤）、ID 先頭 8 桁表示、ページネーション（`src/templates/ui/components/navigation/Pagination.tsx`）、空状態（`src/templates/ui/components/status/Empty.tsx`）を使用
- [ ] T026 [US2] OrderDetail コンポーネントを実装する `src/domains/orders/ui/index.tsx` — GET /api/orders/:id でデータフェッチ内蔵、注文 ID・注文日時・ステータスバッジ・商品一覧・合計金額を表示、戻るボタンで `/orders` に遷移
- [ ] T027 [US2] 注文履歴ページ `src/app/(buyer)/orders/page.tsx` を OrderList コンポーネントで置換する
- [ ] T028 [US2] 注文詳細ページ `src/app/(buyer)/orders/[id]/page.tsx` を OrderDetail コンポーネントで置換する
- [ ] T029 [US2] `src/app/(buyer)/layout.tsx` の navLinks で注文履歴リンク `{ href: '/orders', label: '注文履歴' }` をコメント解除する。spec.md スコープ外のリンクが含まれていないか監査する
- [ ] T030 [US2] テストが成功すること（Green）を確認する — `npx vitest run tests/unit/domains/orders/ui.test.tsx`
- [ ] T031 [US2] リファクタリングの要否を確認する（Refactor フェーズ）

**チェックポイント**: 購入者の注文履歴一覧とドリルダウン詳細が動作し、ヘッダーの注文履歴リンクから遷移できること

---

## Phase 5: ユーザーストーリー 3 — 管理者の注文一覧閲覧（優先度: P3）

**目標**: 管理者が全ユーザーの注文を一覧で確認し、ステータスで絞り込める

**独立テスト**: 管理者でログインし、注文管理ページで全注文が表示されること、ステータス絞り込みが動作すること、購入者がアクセスできないこと

### テスト（Red フェーズ）

- [ ] T032 [P] [US3] 管理者注文一覧 UI テストを作成する `tests/unit/domains/orders/ui.test.tsx` — AdminOrderList コンポーネント: 全注文の表示、ステータスフィルター（ドロップダウン）、絞り込み後の一覧更新、ページネーション、注文クリックで詳細遷移をテスト
- [ ] T033 [US3] テストが失敗すること（Red）を確認する — `npx vitest run tests/unit/domains/orders/ui.test.tsx`

### 実装（Green フェーズ）

- [ ] T034 [US3] AdminOrderList コンポーネントを実装する `src/domains/orders/ui/admin.tsx` — GET /api/orders でデータフェッチ内蔵（管理者は全注文取得）、ステータスフィルタードロップダウン（全件・保留中・確認済み・発送済み・配送完了・キャンセル）、ステータスバッジ（購入者版と同じ色分け）、ページネーション、注文クリックで `/admin/orders/:id` に遷移
- [ ] T035 [US3] 管理者注文一覧ページ `src/app/admin/orders/page.tsx` を AdminOrderList コンポーネントで置換する
- [ ] T036 [US3] `src/app/admin/layout.tsx` の navLinks で注文管理リンク `{ href: '/admin/orders', label: '注文管理' }` をコメント解除する。spec.md スコープ外のリンク（ダッシュボード、商品管理等）が含まれていないか監査し、スコープ外のリンクは削除する
- [ ] T037 [US3] テストが成功すること（Green）を確認する — `npx vitest run tests/unit/domains/orders/ui.test.tsx`
- [ ] T038 [US3] リファクタリングの要否を確認する（Refactor フェーズ）

**チェックポイント**: 管理者の注文一覧とステータス絞り込みが動作し、ヘッダーの注文管理リンクから遷移できること

---

## Phase 6: ユーザーストーリー 4 — 管理者のステータス更新（優先度: P4）

**目標**: 管理者が注文のステータスを遷移ルールに従って更新できる

**独立テスト**: 管理者でログインし、注文詳細からステータスを変更できること、遷移ルールに従わない変更が拒否されること

### テスト（Red フェーズ）

- [ ] T039 [P] [US4] 管理者注文詳細 UI テストを作成する `tests/unit/domains/orders/ui.test.tsx` — AdminOrderDetail コンポーネント: 注文詳細情報の表示、遷移可能なステータスボタンの表示（ValidStatusTransitions に基づく）、ステータス更新時に PATCH /api/orders/:id/status 呼び出し、更新成功時のフィードバック、配送完了・キャンセルの場合はステータス変更ボタン非表示をテスト
- [ ] T040 [US4] テストが失敗すること（Red）を確認する — `npx vitest run tests/unit/domains/orders/ui.test.tsx`

### 実装（Green フェーズ）

- [ ] T041 [US4] AdminOrderDetail コンポーネントを実装する `src/domains/orders/ui/admin.tsx` — GET /api/orders/:id でデータフェッチ内蔵、注文詳細表示（ID・日時・ステータス・商品一覧・合計金額）、`ValidStatusTransitions` を参照して遷移可能なステータスをボタンで表示、ボタンクリックで PATCH /api/orders/:id/status を呼び出し、成功時にステータス更新・フィードバック表示、配送完了・キャンセル状態ではボタン非表示、戻るボタンで `/admin/orders` に遷移
- [ ] T042 [US4] 管理者注文詳細ページ `src/app/admin/orders/[id]/page.tsx` を AdminOrderDetail コンポーネントで置換する
- [ ] T043 [US4] テストが成功すること（Green）を確認する — `npx vitest run tests/unit/domains/orders/ui.test.tsx`
- [ ] T044 [US4] リファクタリングの要否を確認する（Refactor フェーズ）

**チェックポイント**: 管理者がステータスを正常に遷移でき、無効な遷移が拒否されること

---

## Phase 7: E2E テスト

**目的**: 購入者導線と管理者導線の E2E テストで全機能を検証する

### 購入者導線 E2E

- [ ] T045 [P] 購入者導線の E2E テストを作成する `tests/e2e/orders/buyer-flow.spec.ts` — ログイン → 商品をカートに追加 → カートページで「注文手続きへ」ボタン → チェックアウト画面で内容確認 → 「注文を確定」→ 注文完了画面（注文 ID・お礼メッセージ）→ カートが空になる → 注文履歴に注文が表示される → 注文詳細で情報確認 → 空カート時は「注文手続きへ」非表示 → 他人の注文へのアクセス拒否

### 管理者導線 E2E

- [ ] T046 [P] 管理者導線の E2E テストを作成する `tests/e2e/orders/admin-flow.spec.ts` — 管理者ログイン → 注文管理ページで全注文確認 → ステータス絞り込み → 注文詳細表示 → ステータスを「保留中」→「確認済み」→「発送済み」→「配送完了」に順次更新 → 配送完了後は変更ボタン非表示 → 購入者によるアクセス拒否

### E2E 検証

- [ ] T047 購入者導線の E2E テストが全て成功することを確認する — `npx playwright test tests/e2e/orders/buyer-flow.spec.ts`
- [ ] T048 管理者導線の E2E テストが全て成功することを確認する — `npx playwright test tests/e2e/orders/admin-flow.spec.ts`

**チェックポイント**: 購入者導線・管理者導線の全 E2E テストが通過すること

---

## Phase 8: ポリッシュ＆横断的関心事

**目的**: 全ユーザーストーリーに跨る品質確保

### 品質チェック

- [ ] T049 TypeScript コンパイルエラーが 0 件であることを確認する — `npx tsc --noEmit`
- [ ] T050 ESLint エラーが 0 件であることを確認する — `npx eslint src/domains/orders/ src/app/\(buyer\)/checkout/ src/app/\(buyer\)/order-complete/ src/app/\(buyer\)/orders/ src/app/admin/orders/ src/app/api/orders/ tests/unit/domains/orders/ tests/integration/domains/orders/ tests/e2e/orders/`
- [ ] T051 テストカバレッジが 80% 以上であることを確認する — `npx vitest run --coverage`

**チェックポイント**: 全テスト（単体・統合・E2E）が通過し、TypeScript + ESLint エラーが 0 件、カバレッジ 80% 以上であること

---

## 依存関係と実行順序

### フェーズ依存関係

- **セットアップ（Phase 1）**: 依存なし — 即時開始可能
- **基盤（Phase 2）**: Phase 1 の完了に依存 — 全ユーザーストーリーをブロック
- **US1（Phase 3）**: Phase 2 の完了に依存 — 他のストーリーへの依存なし
- **US2（Phase 4）**: Phase 2 の完了に依存 — US1 と並列実行可能（ただし US1 で作成した注文を表示するため、統合テストは US1 完了後が望ましい）
- **US3（Phase 5）**: Phase 2 の完了に依存 — US1/US2 と並列実行可能
- **US4（Phase 6）**: Phase 5 の完了に依存（AdminOrderList に詳細遷移が必要）
- **E2E（Phase 7）**: Phase 3〜6 の完了に依存（全機能が動作することが前提）
- **ポリッシュ（Phase 8）**: 全フェーズ完了後

### 各ユーザーストーリー内の実行順序

1. テスト作成（Red フェーズ）→ テスト失敗確認
2. 実装（Green フェーズ）→ テスト成功確認
3. リファクタリング要否確認（Refactor フェーズ）

### 並列実行の機会

- Phase 1: T002 と T003 は並列実行可能 [P]
- Phase 2: T004 と T009 は並列実行可能（単体テストと統合テストの作成）
- Phase 3: T011, T012, T013 は並列実行可能（異なるテストの作成）
- Phase 4: T022 と T023 は並列実行可能（一覧と詳細のテスト作成）
- Phase 7: T045 と T046 は並列実行可能（購入者と管理者の E2E テスト作成）

---

## 実装戦略

### MVP ファースト（US1 のみ）

1. Phase 1: セットアップ完了
2. Phase 2: 基盤（ドメイン API）完了
3. Phase 3: US1 チェックアウトと注文確定
4. **検証**: カート→チェックアウト→注文確定→完了の一連フローが動作すること

### 段階的デリバリー

1. セットアップ + 基盤 → 基盤完成
2. US1 追加 → カートから注文が可能に（MVP）
3. US2 追加 → 購入者が注文履歴を確認可能に
4. US3 追加 → 管理者が注文一覧を確認可能に
5. US4 追加 → 管理者がステータス更新可能に
6. E2E + ポリッシュ → 品質確保
