# タスク: 注文機能

**入力**: `specs/003-order-management/` の設計ドキュメント
**前提**: plan.md（必須）、spec.md（必須）、research.md、data-model.md、contracts/

**テスト**: TDDアプローチ。各ユースケースにテストタスクを含める。Red → Green → Refactor を厳守。

**構成**: ユーザーストーリー単位でフェーズ分割。各ストーリーを独立して実装・テスト可能にする。

## フォーマット: `[ID] [P?] [Story] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存なし）
- **[Story]**: 所属ユーザーストーリー（US1, US2, US3, US4）
- ファイルパスは正確に記述

---

## Phase 1: セットアップ

**目的**: テストディレクトリ構造の準備と既存コントラクト・インフラの確認

- [ ] T001 テストディレクトリ構造を作成: `tests/unit/domains/orders/`、`tests/integration/domains/orders/`、`tests/e2e/orders/`
- [ ] T002 既存コントラクト `src/contracts/orders.ts` のスキーマ（OrderSchema, OrderItemSchema, 入出力スキーマ, ValidStatusTransitions）が仕様を満たすことを確認

**チェックポイント**: テストディレクトリが存在し、既存コントラクトが要件を網羅していることを確認

---

## Phase 2: 基盤（ブロッキング前提条件）

**目的**: 全ユーザーストーリーに必要なステートマシンヘルパー・リポジトリの動作検証

**注意**: このフェーズが完了するまでユーザーストーリーの実装は開始不可

### テスト（Red フェーズ）

- [ ] T003 [P] ステートマシンヘルパーの単体テストを作成: `tests/unit/domains/orders/usecases.test.ts` — getValidTransitions（各ステータスからの遷移先一覧）、canTransitionTo（有効/無効遷移）、isTerminalStatus（delivered/cancelled が true）のテスト
- [ ] T004 [P] リポジトリ統合テストを作成: `tests/integration/domains/orders/api.test.ts` — OrderRepository の create/findById/findAll/updateStatus/count の基本動作テスト

### 実装（Green フェーズ）

- [ ] T005 ステートマシンヘルパーを作成: `src/domains/orders/types/index.ts` — `getValidTransitions(status)`、`canTransitionTo(current, target)`、`isTerminalStatus(status)` 関数を実装。`src/contracts/orders.ts` の `ValidStatusTransitions` を使用
- [ ] T006 テスト T003, T004 の Red 確認後、既存リポジトリ `src/infrastructure/repositories/order.ts` の動作を確認し、テストがすべてパスすることを検証

**チェックポイント**: ステートマシンヘルパーのテスト・リポジトリ統合テストがすべてパス。基盤準備完了

---

## Phase 3: US1 - チェックアウトと注文確定（優先度: P1）🎯 MVP

**目的**: 購入者がカート内容を確認して注文を確定し、注文完了画面を表示する

**独立テスト**: カートに商品を追加した状態でチェックアウト画面を開き、注文確定ボタンを押して注文完了画面が表示されることを確認できる

### テスト（Red フェーズ）

- [ ] T007 [P] [US1] createOrder ユースケース単体テストを作成: `tests/unit/domains/orders/usecases.test.ts` — 注文作成（正常系: カートから注文明細作成、totalAmount に subtotal 使用、ステータス pending）、カート空でエラー（EmptyCartError）、buyer 認可チェック、confirmed フラグバリデーション、注文作成後にカートクリア確認
- [ ] T008 [P] [US1] getOrderById ユースケース単体テストを作成: `tests/unit/domains/orders/usecases.test.ts` — 注文取得（正常系）、存在しない注文で NotFoundError、購入者が他人の注文にアクセスして NotFoundError
- [ ] T009 [P] [US1] POST `/api/orders` 統合テストを作成: `tests/integration/domains/orders/api.test.ts` — 注文作成API呼び出し（200返却、Order オブジェクト返却）、カート空で 400 エラー
- [ ] T010 [P] [US1] チェックアウト・注文完了E2Eテストを作成: `tests/e2e/orders/buyer-checkout.spec.ts` — カートに商品追加 → チェックアウト画面で商品一覧・合計金額表示 → 注文確定 → 完了画面に注文IDとお礼メッセージ → カートが空になっている、カート空でチェックアウト画面に注文確定ボタン非表示

### 実装（Green フェーズ）

- [ ] T011 [US1] createOrder 本番ユースケースを作成: `src/domains/orders/api/usecases.ts` — `src/contracts/orders.ts` の OrderRepository・CartFetcher インターフェースに準拠。buyer 認可、confirmed バリデーション、カート取得・空チェック、注文明細作成（カートアイテムから）、totalAmount に cart.subtotal 使用、status: 'pending' で注文作成、カートクリア
- [ ] T012 [US1] getOrderById 本番ユースケースを作成: `src/domains/orders/api/usecases.ts` に追加 — 注文取得、buyer は自分の注文のみ閲覧可能（他人の注文は NotFoundError）
- [ ] T013 [US1] `src/domains/orders/api/index.ts` を更新: samples の再エクスポートから本番 usecases のエクスポートに切り替え（createOrder, getOrderById, NotFoundError, EmptyCartError, InvalidStatusTransitionError）
- [ ] T014 [US1] チェックアウトページを確認・更新: `src/app/(buyer)/checkout/page.tsx` — 既存ページがドメイン api/index.ts からインポートしていることを確認。カート空時の注文確定ボタン非表示、二重送信防止、注文完了後のリダイレクト（`/orders/{id}?completed=true`）が動作することを検証

**チェックポイント**: チェックアウト画面からカート内容を確認して注文確定でき、注文完了画面が表示される。T007〜T010 のテストがすべてパス

---

## Phase 4: US2 - 注文履歴・注文詳細（優先度: P2）

**目的**: 購入者が自分の注文一覧を確認し、注文詳細を閲覧できる

**独立テスト**: 注文を1件以上作成した状態で注文履歴ページを開き、注文一覧と詳細画面が正しく表示されることを確認できる

### テスト（Red フェーズ）

- [ ] T015 [P] [US2] getOrders ユースケース単体テストを作成: `tests/unit/domains/orders/usecases.test.ts` — 注文一覧取得（buyer は自分の注文のみ）、ページネーション（page, limit, total, totalPages）、注文0件で空配列返却
- [ ] T016 [P] [US2] OrderList・OrderDetail コンポーネント単体テストを作成: `tests/unit/domains/orders/components.test.tsx` — OrderList: 注文一覧表示（注文ID先頭8桁・注文日・商品数・合計金額・ステータスバッジ）、ページネーション表示、注文0件で「注文がありません」メッセージ。OrderDetail: 注文ID・注文日時・ステータス・商品一覧・合計金額表示
- [ ] T017 [P] [US2] 購入者注文履歴・注文詳細E2Eテストを作成: `tests/e2e/orders/buyer-orders.spec.ts` — 注文一覧ページで注文が表示される、注文クリックで詳細画面遷移、他人の注文にアクセス不可（404）、注文0件で空メッセージ表示

### 実装（Green フェーズ）

- [ ] T018 [US2] getOrders 本番ユースケースを作成: `src/domains/orders/api/usecases.ts` に追加 — buyer は自分の注文のみ（userId 自動フィルタ）、ページネーション対応
- [ ] T019 [US2] `src/domains/orders/api/index.ts` に getOrders を追加エクスポート
- [ ] T020 [P] [US2] OrderList コンポーネントを作成: `src/domains/orders/ui/OrderList.tsx` — 注文一覧表示（注文ID先頭8桁・注文日・商品数・合計金額・StatusBadge）、Pagination テンプレート使用（20件/ページ）、注文0件で Empty テンプレート使用（「注文がありません」メッセージ）
- [ ] T021 [P] [US2] OrderDetail コンポーネントを作成: `src/domains/orders/ui/OrderDetail.tsx` — 注文ID・注文日時・StatusBadge・商品一覧テーブル（商品名・単価・数量・小計）・合計金額表示、注文完了メッセージ表示（`completed=true` クエリパラメータ時）
- [ ] T022 [US2] `src/domains/orders/ui/index.ts` を更新: samples の再エクスポートから本番コンポーネントのエクスポートに切り替え（OrderList, OrderDetail）
- [ ] T023 [US2] 購入者注文一覧ページを作成: `src/app/(buyer)/orders/page.tsx` — GET `/api/orders` からデータ取得、OrderList に渡して表示、ページネーション対応
- [ ] T024 [US2] 購入者注文詳細ページを作成: `src/app/(buyer)/orders/[id]/page.tsx` — GET `/api/orders/:id` からデータ取得、OrderDetail に渡して表示、注文完了メッセージ対応

**チェックポイント**: 購入者が注文一覧・詳細を確認でき、他人の注文にはアクセスできない。T015〜T017 のテストがすべてパス

---

## Phase 5: US3 - 管理者の注文一覧閲覧（優先度: P3）

**目的**: 管理者が全ユーザーの注文を一覧で確認し、ステータスで絞り込める

**独立テスト**: 管理者としてログインし、注文管理ページで全注文の一覧が表示され、ステータスフィルタが動作することを確認できる

### テスト（Red フェーズ）

- [ ] T025 [P] [US3] getOrders の管理者向け単体テストを追加: `tests/unit/domains/orders/usecases.test.ts` — admin は全注文取得可能、ステータスフィルタ（status パラメータ）、userId フィルタ（admin のみ）
- [ ] T026 [P] [US3] 管理者注文管理E2Eテストを作成: `tests/e2e/orders/admin-orders.spec.ts` — 管理者ログイン → 注文管理ページで全注文表示、ステータスフィルタで絞り込み、注文クリックで詳細画面遷移、購入者が管理者ページにアクセスして拒否される

### 実装（Green フェーズ）

- [ ] T027 [US3] getOrders ユースケースの管理者対応を確認: `src/domains/orders/api/usecases.ts` — admin ロールでの全注文取得、ステータスフィルタ、userId フィルタが正しく動作することを検証（Phase 4 で実装済みのコードが admin にも対応していることを確認）
- [ ] T028 [US3] 管理者注文一覧ページを確認・更新: `src/app/admin/orders/page.tsx` — 既存ページがドメイン api/index.ts からインポートしていることを確認。ステータスフィルタ、注文一覧テーブル表示が動作することを検証
- [ ] T029 [US3] 管理者注文詳細ページを確認: `src/app/admin/orders/[id]/page.tsx` — 既存ページが注文詳細を正しく表示することを確認

**チェックポイント**: 管理者が全注文を一覧で確認でき、ステータスフィルタが動作する。購入者は管理者ページにアクセスできない。T025〜T026 のテストがすべてパス

---

## Phase 6: US4 - 注文ステータス更新（優先度: P4）

**目的**: 管理者が注文のステータスをステートマシンの遷移ルールに従って更新できる

**独立テスト**: 管理者として注文詳細画面からステータスを変更し、遷移ルールに従った更新が正しく反映されることを確認できる

### テスト（Red フェーズ）

- [ ] T030 [P] [US4] updateOrderStatus ユースケース単体テストを作成: `tests/unit/domains/orders/usecases.test.ts` — ステータス更新（pending→confirmed 正常系）、pending→cancelled、confirmed→shipped、confirmed→cancelled、shipped→delivered、無効な遷移で InvalidStatusTransitionError（shipped→cancelled、delivered→confirmed、cancelled→pending）、存在しない注文で NotFoundError、admin 認可チェック
- [ ] T031 [P] [US4] PATCH `/api/orders/:id` 統合テストを作成: `tests/integration/domains/orders/api.test.ts` — ステータス更新API呼び出し（200返却）、無効な遷移で 400 エラー、存在しない注文で 404
- [ ] T032 [P] [US4] 管理者ステータス更新E2Eテストを作成: `tests/e2e/orders/admin-orders.spec.ts` に追加 — 注文詳細画面でステータスを「確認済み」に変更 → 反映確認、「配送完了」の注文でステータス変更不可（遷移先なし）

### 実装（Green フェーズ）

- [ ] T033 [US4] updateOrderStatus 本番ユースケースを作成: `src/domains/orders/api/usecases.ts` に追加 — admin 認可、入力バリデーション、注文取得、ValidStatusTransitions によるステートマシン遷移チェック、InvalidStatusTransitionError
- [ ] T034 [US4] `src/domains/orders/api/index.ts` に updateOrderStatus を追加エクスポート。すべてのサンプルインポートを本番に完全切り替え
- [ ] T035 [US4] 管理者注文詳細ページのステータス更新を確認: `src/app/admin/orders/[id]/page.tsx` — 既存ページのステータス変更ドロップダウンが遷移ルールに従った選択肢のみ表示し、更新が正しく動作することを検証

**チェックポイント**: 管理者がステータス遷移ルールに従って注文ステータスを更新できる。無効な遷移は拒否される。T030〜T032 のテストがすべてパス

---

## Phase 7: ナビゲーション & 最終検証

**目的**: ナビゲーションリンク追加、全テスト実行、カバレッジ確認

- [ ] T036 購入者レイアウトの navLinks に注文履歴リンクを追加: `src/app/(buyer)/layout.tsx` — `{ href: '/orders', label: '注文履歴' }` を追加
- [ ] T037 管理者レイアウトの navLinks に注文管理リンクを追加: `src/app/admin/layout.tsx` — `{ href: '/admin/orders', label: '注文管理' }` をコメント解除して追加
- [ ] T038 ナビゲーションE2Eテストを追加: `tests/e2e/orders/buyer-orders.spec.ts` に追加 — ヘッダーに「注文履歴」リンクが表示され、クリックで `/orders` に遷移すること。管理者サイドバーに「注文管理」リンクが表示され、クリックで `/admin/orders` に遷移すること
- [ ] T039 全テストスイートを実行し、すべてパスすることを確認（vitest + playwright）
- [ ] T040 TypeScript コンパイルエラーが0件であることを確認
- [ ] T041 テストカバレッジが80%以上であることを確認

**チェックポイント**: 全テストパス、TypeScript エラー0件、カバレッジ80%以上

---

## 依存関係 & 実行順序

### フェーズ依存関係

- **Phase 1（セットアップ）**: 依存なし — 即座に開始可能
- **Phase 2（基盤）**: Phase 1 完了に依存 — 全ユーザーストーリーをブロック
- **Phase 3（US1: チェックアウト）**: Phase 2 完了に依存 — 他ストーリーへの依存なし
- **Phase 4（US2: 注文履歴）**: Phase 3 完了に依存（注文データが必要）
- **Phase 5（US3: 管理者一覧）**: Phase 4 完了に依存（getOrders が必要）
- **Phase 6（US4: ステータス更新）**: Phase 5 完了に依存（管理者ページが必要）
- **Phase 7（最終検証）**: Phase 6 完了に依存

### ユーザーストーリー依存関係

- **US1（チェックアウト）**: Phase 2 完了後に開始可能。他ストーリーへの依存なし
- **US2（注文履歴）**: US1 で注文作成が動作している必要がある
- **US3（管理者一覧）**: US2 で getOrders が実装済みである必要がある
- **US4（ステータス更新）**: US3 で管理者ページが動作している必要がある

### 各ユーザーストーリー内の実行順序

- テスト（Red）を先に記述し、失敗を確認
- ユースケース → エクスポート切り替え → UI コンポーネント → ページ統合の順
- ストーリー完了をチェックポイントで検証してから次のストーリーに進む

### 並列実行可能なタスク

- T003, T004（基盤テスト）
- T007, T008, T009, T010（US1 テスト）
- T015, T016, T017（US2 テスト）
- T020, T021（US2 UI コンポーネント）
- T025, T026（US3 テスト）
- T030, T031, T032（US4 テスト）

---

## 並列実行例: US1

```bash
# US1 のテストをすべて並列起動（Red フェーズ）:
Task: "createOrder ユースケース単体テスト — tests/unit/domains/orders/usecases.test.ts"
Task: "getOrderById ユースケース単体テスト — tests/unit/domains/orders/usecases.test.ts"
Task: "POST /api/orders 統合テスト — tests/integration/domains/orders/api.test.ts"
Task: "チェックアウトE2Eテスト — tests/e2e/orders/buyer-checkout.spec.ts"
```

---

## 実装戦略

### MVP ファースト（US1 のみ）

1. Phase 1: セットアップ完了
2. Phase 2: 基盤完了（ステートマシンヘルパー・リポジトリ検証）
3. Phase 3: US1 完了（チェックアウトと注文確定）
4. **検証停止**: US1 を独立テスト
5. デモ可能な状態

### インクリメンタルデリバリー

1. セットアップ + 基盤 → 基盤準備完了
2. US1 追加 → 独立テスト → MVP!（チェックアウト→注文確定）
3. US2 追加 → 独立テスト →（注文履歴・詳細閲覧）
4. US3 追加 → 独立テスト →（管理者注文一覧）
5. US4 追加 → 独立テスト →（ステータス更新）
6. ナビゲーション + 最終検証 → リリース準備完了

---

## 備考

- [P] タスク = 異なるファイル、依存なし
- [Story] ラベルは各タスクのユーザーストーリーへの紐付け
- 各ユーザーストーリーは独立して完了・テスト可能
- テスト失敗を確認してから実装する（Red → Green → Refactor）
- 各タスクまたは論理グループの完了後にコミット
- spec.md に定義されていない機能は実装しない
