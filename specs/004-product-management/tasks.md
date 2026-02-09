# タスク一覧: 商品管理機能

**入力**: `specs/004-product-management/` の設計ドキュメント
**前提**: plan.md（必須）, spec.md（必須）, research.md, data-model.md, contracts/api.md, quickstart.md

**テスト**: TDD アプローチ（Red → Green → Refactor）を徹底。各ユースケースにテストタスクを含める。

**構成**: ユーザーストーリー単位でフェーズを分割し、各ストーリーを独立して実装・テスト可能にする。

## フォーマット: `[ID] [P?] [Story] 説明`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: 対応するユーザーストーリー（US1, US2, US3, US4）
- 各タスクに正確なファイルパスを含める

---

## フェーズ 1: セットアップ（共有インフラ）

**目的**: contract の分離、ディレクトリ構成、テスト基盤の準備

- [ ] T001 src/contracts/product.ts を新規作成し、catalog.ts から CRUD スキーマ（CreateProductInput, UpdateProductInput, DeleteProductInput）を移動する。Product・ProductRepository は catalog.ts から再エクスポートする。UpdateProductStatusInput スキーマを新規追加する
- [ ] T002 src/contracts/catalog.ts をリファクタリングし、CRUD スキーマ（CreateProductInput, UpdateProductInput, DeleteProductInput）を削除して読み取り専用（GetProductsInput/Output, GetProductByIdInput/Output, Product, ProductRepository）のみ残す
- [ ] T003 src/domains/product/ ディレクトリを作成し、api/index.ts と ui/index.tsx, ui/admin.tsx のスケルトンファイルを配置する
- [ ] T004 [P] テストディレクトリを作成する: tests/unit/domains/product/, tests/integration/domains/product/, tests/e2e/products/

**チェックポイント**: contract が CQRS パターンで分離され、product ドメインのディレクトリ構成が完成していること

---

## フェーズ 2: 基盤 — ドメイン API ユースケース（TDD）

**目的**: product ドメインの全ユースケースをテスト駆動で実装する。全ユーザーストーリーの基盤となるため、このフェーズの完了が必須

**⚠️ 重要**: このフェーズが完了するまで、ユーザーストーリーの実装は開始できない

### テスト（Red フェーズ）

> **注意: テストを先に書き、実装前に失敗することを確認する**

- [ ] T005 [P] getProducts ユースケースの単体テストを作成する: tests/unit/domains/product/usecase.test.ts — ページネーション（20件/ページ）、ステータスフィルタ、認証チェック
- [ ] T006 [P] getProductById ユースケースの単体テストを作成する: tests/unit/domains/product/usecase.test.ts — 正常取得、存在しないID、認証チェック
- [ ] T007 [P] createProduct ユースケースの単体テストを作成する: tests/unit/domains/product/usecase.test.ts — 必須項目のみ、全項目、バリデーションエラー、デフォルトステータス=draft
- [ ] T008 [P] updateProduct ユースケースの単体テストを作成する: tests/unit/domains/product/usecase.test.ts — 部分更新、存在しないID、バリデーションエラー
- [ ] T009 [P] updateProductStatus ユースケースの単体テストを作成する: tests/unit/domains/product/usecase.test.ts — 全ステータス遷移（draft↔published↔archived）、無効ステータス値
- [ ] T010 [P] deleteProduct ユースケースの単体テストを作成する: tests/unit/domains/product/usecase.test.ts — 正常削除、存在しないID、認証チェック

### 実装（Green フェーズ）

- [ ] T011 src/domains/product/api/index.ts に全ユースケースを実装する: getProducts, getProductById, createProduct, updateProduct, updateProductStatus, deleteProduct — productRepository を使用し、validate()/success()/error() パターンに従う

### 統合テスト

- [ ] T012 [P] 統合テストを作成する: tests/integration/domains/product/api.test.ts — 各ユースケースの実際のリポジトリ連携テスト（データ作成→取得→更新→ステータス変更→削除のフロー）

**チェックポイント**: product ドメインの全ユースケースが単体テスト・統合テスト付きで動作すること

---

## フェーズ 3: ユーザーストーリー 1 — 商品一覧表示とステータス変更（優先度: P1）🎯 MVP

**ゴール**: 管理者が全商品をテーブル形式で一覧表示し、ステータスをドロップダウンから即時変更できる

**独立テスト**: 管理者でログイン後、商品管理ページにアクセスし、テーブル形式で商品一覧が表示されること、ステータスドロップダウンからの変更が即時反映されることを確認

### テスト（Red フェーズ）

> **注意: テストを先に書き、実装前に失敗することを確認する**

- [ ] T013 [P] [US1] AdminProductList コンポーネントの単体テストを作成する: tests/unit/domains/product/ui.test.tsx — テーブル表示（商品名・価格・ステータス列）、ページネーション（20件/ページ）、ステータス変更ドロップダウン、空一覧メッセージ、編集・削除ボタン表示
- [ ] T014 [P] [US1] GET /api/products の統合テストを作成する: tests/integration/domains/product/api.test.ts — 一覧取得、ページネーション、ステータスフィルタ、認証エラー
- [ ] T015 [P] [US1] PATCH /api/products/:id/status の統合テストを作成する: tests/integration/domains/product/api.test.ts — ステータス変更成功、無効ステータス、存在しないID、認証エラー

### 実装

- [ ] T016 [US1] AdminProductList コンポーネントを実装する: src/domains/product/ui/index.tsx — テーブル形式（商品名・価格・ステータス列）、Pagination コンポーネント使用（20件/ページ）、ステータス変更ドロップダウン（draft/published/archived）、編集・削除ボタン、空一覧時メッセージ
- [ ] T017 [US1] GET /api/products API Route を作成する: src/app/api/products/route.ts — authorize('admin') で認証、page/limit/status クエリパラメータ、product ドメインの getProducts を呼び出し
- [ ] T018 [US1] PATCH /api/products/:id/status API Route を作成する: src/app/api/products/[id]/status/route.ts — authorize('admin') で認証、product ドメインの updateProductStatus を呼び出し
- [ ] T019 [US1] src/app/admin/products/page.tsx のスタブを AdminProductList に置き換える
- [ ] T020 [US1] src/app/admin/layout.tsx の navLinks に「商品管理」リンクを追加し、spec.md スコープ外のリンクが残っていないか監査する

**チェックポイント**: 管理者が商品一覧を表示し、ステータスを変更できること。購入者はアクセスを拒否されること

---

## フェーズ 4: ユーザーストーリー 2 — 商品新規登録（優先度: P2）

**ゴール**: 管理者が新しい商品を登録でき、「下書き」ステータスで作成される

**独立テスト**: 管理者でログイン後、新規登録ページで必須項目を入力して登録し、一覧に新商品が「下書き」ステータスで表示されることを確認

### テスト（Red フェーズ）

> **注意: テストを先に書き、実装前に失敗することを確認する**

- [ ] T021 [P] [US2] ProductForm（新規登録モード）コンポーネントの単体テストを作成する: tests/unit/domains/product/ui.test.tsx — フォーム表示（商品名・価格・説明・画像URL・在庫数）、バリデーションエラー表示（必須項目、文字数制限、数値範囲、URL形式）、登録成功後の一覧遷移
- [ ] T022 [P] [US2] POST /api/products の統合テストを作成する: tests/integration/domains/product/api.test.ts — 新規登録成功（201）、バリデーションエラー（400）、認証エラー（403）

### 実装

- [ ] T023 [US2] ProductForm コンポーネントを実装する（新規登録モード）: src/domains/product/ui/index.tsx — FormField コンポーネント使用、バリデーションエラーの各フィールド表示、登録成功後に router.push('/admin/products')
- [ ] T024 [US2] POST /api/products API Route を作成する: src/app/api/products/route.ts に POST ハンドラを追加 — authorize('admin') で認証、product ドメインの createProduct を呼び出し、201 レスポンス
- [ ] T025 [US2] src/app/admin/products/new/page.tsx のスタブを ProductForm（新規登録モード）に置き換える

**チェックポイント**: 管理者が商品を新規登録でき、バリデーションが機能し、一覧に「下書き」ステータスで表示されること

---

## フェーズ 5: ユーザーストーリー 3 — 商品編集（優先度: P3）

**ゴール**: 管理者が既存商品を編集でき、既存データのプリロードと部分更新をサポートする

**独立テスト**: 管理者でログイン後、既存商品の編集ページを開き、データがプリロードされていることを確認し、変更して保存後に一覧で反映を確認

### テスト（Red フェーズ）

> **注意: テストを先に書き、実装前に失敗することを確認する**

- [ ] T026 [P] [US3] ProductForm（編集モード）コンポーネントの単体テストを作成する: tests/unit/domains/product/ui.test.tsx — 既存データのプリロード、部分更新、バリデーションエラー、存在しない商品の404表示、保存成功後の一覧遷移
- [ ] T027 [P] [US3] AdminProductDetail（編集ページ用データ取得）の単体テストを作成する: tests/unit/domains/product/ui.test.tsx — 商品データ取得・フォームへの受け渡し、404エラー
- [ ] T028 [P] [US3] GET /api/products/:id および PUT /api/products/:id の統合テストを作成する: tests/integration/domains/product/api.test.ts — 詳細取得、部分更新、バリデーションエラー、存在しないID、認証エラー

### 実装

- [ ] T029 [US3] AdminProductDetail コンポーネントを実装する: src/domains/product/ui/admin.tsx — 商品データの取得と ProductForm への受け渡し、404 エラー表示
- [ ] T030 [US3] ProductForm の編集モードを実装する: src/domains/product/ui/index.tsx — 既存データのプリロード、PUT リクエスト送信、部分更新
- [ ] T031 [US3] GET /api/products/:id および PUT /api/products/:id API Route を作成する: src/app/api/products/[id]/route.ts — authorize('admin') で認証、product ドメインの getProductById/updateProduct を呼び出し
- [ ] T032 [US3] src/app/admin/products/[id]/edit/page.tsx のスタブを AdminProductDetail + ProductForm（編集モード）に置き換える

**チェックポイント**: 管理者が既存商品を編集でき、既存データがプリロードされ、部分更新が機能すること

---

## フェーズ 6: ユーザーストーリー 4 — 商品削除（優先度: P4）

**ゴール**: 管理者が商品を削除でき、確認ダイアログで誤削除を防止する

**独立テスト**: 管理者でログイン後、商品一覧から削除ボタンを押し、確認ダイアログで「削除する」を選択後に商品が消えることを確認

### テスト（Red フェーズ）

> **注意: テストを先に書き、実装前に失敗することを確認する**

- [ ] T033 [P] [US4] AdminProductList の削除機能の単体テストを作成する: tests/unit/domains/product/ui.test.tsx — 削除ボタンクリックで ConfirmDialog 表示、確認後に商品削除、キャンセルで削除されない
- [ ] T034 [P] [US4] DELETE /api/products/:id の統合テストを作成する: tests/integration/domains/product/api.test.ts — 削除成功、存在しないID、認証エラー

### 実装

- [ ] T035 [US4] AdminProductList に削除機能を統合する: src/domains/product/ui/index.tsx — 削除ボタン + ConfirmDialog（テンプレートから再利用）、DELETE リクエスト送信、一覧の再取得
- [ ] T036 [US4] DELETE /api/products/:id API Route を作成する: src/app/api/products/[id]/route.ts に DELETE ハンドラを追加 — authorize('admin') で認証、product ドメインの deleteProduct を呼び出し

**チェックポイント**: 管理者が商品を削除でき、確認ダイアログが機能し、一覧から商品が消えること

---

## フェーズ 7: CQRS リファクタリング

**目的**: catalog ドメインから書き込みスタブを削除し、読み取り専用にリファクタリングする

- [ ] T037 src/domains/catalog/api/index.ts から createProduct, updateProduct, deleteProduct スタブと NotImplementedError クラスを削除する
- [ ] T038 src/app/api/catalog/products/route.ts から POST ハンドラを削除し、GET のみ残す
- [ ] T039 src/app/api/catalog/products/[id]/route.ts から PUT/DELETE ハンドラを削除し、GET のみ残す
- [ ] T040 catalog ドメインの既存テストを確認・修正する: 削除したスタブに依存するテストがあれば更新する

**チェックポイント**: catalog ドメインが読み取り専用になり、既存の catalog テストが全て通ること

---

## フェーズ 8: E2E テスト

**目的**: エンドツーエンドでの全フロー検証

- [ ] T041 [P] 管理者フロー E2E テストを作成する: tests/e2e/products/admin-flow.spec.ts — 商品一覧表示、新規登録、編集、ステータス変更、削除の一連のフロー
- [ ] T042 [P] 購入者アクセス拒否 E2E テストを作成する: tests/e2e/products/buyer-access.spec.ts — buyer ロールでの /admin/products アクセス拒否確認

**チェックポイント**: 全 E2E テストが通ること

---

## フェーズ 9: ポリッシュ＆品質チェック

**目的**: 品質基準の確認と最終調整

- [ ] T043 TypeScript コンパイルチェック（エラー 0 件）
- [ ] T044 ESLint チェック（エラー・警告 0 件）
- [ ] T045 テストカバレッジ確認（80% 以上）
- [ ] T046 quickstart.md の全シナリオを手動で検証する

---

## 依存関係と実行順序

### フェーズ間の依存関係

- **セットアップ（フェーズ 1）**: 依存なし — 即時開始可能
- **基盤（フェーズ 2）**: フェーズ 1 の完了が必須 — **全ユーザーストーリーをブロック**
- **ユーザーストーリー（フェーズ 3〜6）**: フェーズ 2 の完了が必須
  - US1（フェーズ 3）→ US2（フェーズ 4）→ US3（フェーズ 5）→ US4（フェーズ 6）の順で実装
  - US2〜US4 は US1 の一覧ページに依存するため、優先順位通りの順次実装を推奨
- **CQRS リファクタリング（フェーズ 7）**: フェーズ 2 の完了後、フェーズ 3〜6 と並行して実施可能。ただし全 US 完了後を推奨
- **E2E テスト（フェーズ 8）**: フェーズ 3〜7 の全完了が必須
- **ポリッシュ（フェーズ 9）**: フェーズ 8 の完了が必須

### ユーザーストーリー間の依存関係

- **US1（P1）**: フェーズ 2 完了後に開始可能 — 他ストーリーへの依存なし
- **US2（P2）**: US1 の一覧ページ（AdminProductList）に依存 — 登録後の遷移先として必要
- **US3（P3）**: US1 の一覧ページ + US2 の ProductForm コンポーネントに依存 — フォームを編集モードで再利用
- **US4（P4）**: US1 の一覧ページ（AdminProductList）に依存 — 削除ボタンを一覧に統合

### 各ユーザーストーリー内の実行順序

- テスト（Red）を先に書き、失敗を確認する
- コンポーネント実装（Green）
- API Route 実装
- ページスタブの置き換え
- リファクタリング（必要に応じて）

### 並列実行の機会

- フェーズ 1: T003 と T004 は並列実行可能
- フェーズ 2: T005〜T010 の全テストは並列作成可能、T012 も並列可能
- フェーズ 3: T013〜T015 のテストは並列作成可能
- フェーズ 4: T021〜T022 のテストは並列作成可能
- フェーズ 5: T026〜T028 のテストは並列作成可能
- フェーズ 6: T033〜T034 のテストは並列作成可能
- フェーズ 8: T041 と T042 は並列作成可能

---

## 並列実行例: フェーズ 2（基盤ユースケース）

```bash
# 全ユースケースのテストを並列で作成（Red フェーズ）:
Task: "getProducts テスト作成 in tests/unit/domains/product/usecase.test.ts"
Task: "getProductById テスト作成 in tests/unit/domains/product/usecase.test.ts"
Task: "createProduct テスト作成 in tests/unit/domains/product/usecase.test.ts"
Task: "updateProduct テスト作成 in tests/unit/domains/product/usecase.test.ts"
Task: "updateProductStatus テスト作成 in tests/unit/domains/product/usecase.test.ts"
Task: "deleteProduct テスト作成 in tests/unit/domains/product/usecase.test.ts"

# テスト失敗確認後、全ユースケースを一括実装（Green フェーズ）:
Task: "全ユースケース実装 in src/domains/product/api/index.ts"
```

---

## 実装戦略

### MVP ファースト（US1 のみ）

1. フェーズ 1: セットアップ完了
2. フェーズ 2: 基盤ユースケース完了（全 CRUD ユースケース）
3. フェーズ 3: US1 — 商品一覧 + ステータス変更
4. **停止して検証**: US1 を単独でテスト
5. 管理者が商品一覧を閲覧しステータスを変更できることを確認

### インクリメンタルデリバリー

1. セットアップ + 基盤 → 基盤完成
2. US1 追加 → 単独テスト → **MVP 完了！**
3. US2 追加 → 新規登録が機能することを確認
4. US3 追加 → 編集が機能することを確認
5. US4 追加 → 削除が機能することを確認
6. CQRS リファクタリング → catalog が読み取り専用になることを確認
7. E2E テスト → 全フロー通過
8. ポリッシュ → 品質基準達成

---

## ノート

- [P] タスク = 異なるファイル、依存関係なし
- [Story] ラベル = 対応するユーザーストーリーへのトレーサビリティ
- 各ユーザーストーリーは独立して完成・テスト可能
- テストは実装前に書き、失敗を確認すること（Red → Green → Refactor）
- 各タスクまたは論理グループの完了後にコミットすること
- 任意のチェックポイントで停止し、ストーリーを独立検証可能
