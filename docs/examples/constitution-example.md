# Constitution Example - ECサイトプロジェクト向け

`/speckit.constitution` 実行時の入力例です。

```
/speckit.constitution 
# プロジェクト概要
プロジェクト名: トレーニングECサイト
説明: Next.js + TypeScriptで構築するECサイト。EC Site Architecture Templateをベースに実装。

# 技術スタック
- Next.js 14 (App Router)
- TypeScript 5 (strict mode)
- React 18
- Tailwind CSS 3
- Zod (バリデーション)
- Vitest (単体・統合テスト)
- Playwright (E2Eテスト)

# アーキテクチャ原則
1. テンプレート駆動開発
   - UI/API/テストは templates/ のテンプレートを基に実装
   - 共通基盤は foundation/ を使用

2. ドメイン分離
   - 各ドメインは src/domains/[domain]/ に独立して実装
   - ドメイン間の依存は API 経由のみ

3. テストファースト
   - TDD（Red → Green → Refactor）を徹底する
   - 各ユースケースにテストタスクを含める
   - カバレッジ80%以上を維持

4. 共通UIコンポーネントの利用
   - ドメイン実装時は `@/templates/ui/components/` の共通コンポーネントを使用し、同等機能の独自実装を禁止する

5. 実装ワークフロー
   - src/domains/ のスタブ（API: NotImplementedError → 本番APIは501応答、UI: 「ドメイン未実装」プレースホルダー）を本番実装に置き換える
   - 既存ドメイン（catalog, cart, orders）の本番ページ（src/app/(buyer)/, src/app/admin/）と API Routes（src/app/api/）は配置済み。@/domains/ のスタブを置換すればページとAPIが自動的に動作する
   - src/contracts/ に準拠し、src/samples/ を参考に実装する
   - spec.md に定義されていない機能は実装しない。samples や他ドメインに含まれる機能であっても、現在の仕様のスコープ外であれば除外する
   - ユーザーストーリー単位でフェーズを分割し、各ストーリーを独立して実装・テスト可能にする
   - ドメイン実装時にレイアウトファイルの navLinks のコメントを解除してナビゲーションリンクを有効化する
     - 購入者向け: src/app/(buyer)/layout.tsx の navLinks のコメントを解除（例: { href: '/catalog', label: '商品一覧' }）
     - 管理者向け: src/app/admin/layout.tsx の navLinks のコメントを解除（例: { href: '/admin/products', label: '商品管理' }）
     - navLinks はデフォルトで空（購入者）またはダッシュボードのみ（管理者）。実装したドメインのリンクのみ有効化する

# 品質基準
- TypeScript: strictモード、エラー0件
- ESLint: エラー0件
- テストカバレッジ: 80%以上
- E2Eテスト: 主要導線をカバー
- パフォーマンス: 一覧ページ初回ロード3秒以内

# 認証・認可
- ロール: buyer（購入者）, admin（管理者）
- セッション管理: Cookie-based
- 認可: RBAC (Role-Based Access Control)

# 命名規約
- ファイル名: kebab-case (例: product-list.tsx)
- コンポーネント: PascalCase (例: ProductList)
- 関数: camelCase (例: getProducts)
- 定数: UPPER_SNAKE_CASE (例: MAX_ITEMS)
- 型: PascalCase (例: ProductType)

# E2Eテスト作成時の注意事項
- 本番E2Eテストは `tests/e2e/` 直下に配置する（サンプルテストの `src/samples/tests/e2e/` とは分離）
- テスト作成時は `src/samples/tests/e2e/domains/` 配下のサンプルE2Eテストを参照すること

# E2Eテスト実行時の注意事項
- E2Eテスト実行前にポート3000を占有している既存プロセスを必ず停止する
- Windows環境ではBashの `$_` がextglobで壊れるため、PowerShellスクリプトは `powershell.exe -File -` + heredocで実行する
- データ変更後は `.next` キャッシュを削除してからサーバーを再起動する（`globalThis` のインメモリストアがHMRで残るため）

# 前提
すべてのプロジェクト憲章・仕様書・計画・タスク・実装に関するドキュメントは見出し・本文ともに日本語で記述すること。
```