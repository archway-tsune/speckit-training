<!--
  Sync Impact Report
  ===================
  Version change: N/A (initial) → 1.0.0
  Bump rationale: Initial ratification — MAJOR version 1.0.0

  Added principles:
    - I. テンプレート駆動開発
    - II. ドメイン分離
    - III. テストファースト（非交渉）
    - IV. 実装ワークフロー

  Added sections:
    - 品質基準・命名規約
    - 認証・認可・E2Eテスト注意事項

  Removed sections: なし

  Templates requiring updates:
    - .specify/templates/plan-template.md          ✅ 整合性確認済（Constitution Check セクション既存）
    - .specify/templates/spec-template.md           ✅ 整合性確認済（ユーザーストーリー・独立テスト構造既存）
    - .specify/templates/tasks-template.md          ✅ 整合性確認済（テストファースト・ストーリー単位構造既存）
    - .specify/templates/agent-file-template.md     ✅ 整合性確認済（汎用テンプレート、原則固有参照なし）
    - .specify/templates/checklist-template.md      ✅ 整合性確認済（汎用テンプレート）

  Follow-up TODOs: なし
-->

# トレーニングECサイト 憲章

## プロジェクト概要

Next.js + TypeScript で構築する EC サイト。
EC Site Architecture Template をベースに実装する。

## コア原則

### I. テンプレート駆動開発

- UI・API・テストは `src/templates/` のテンプレートを基に実装しなければならない（MUST）
- 共通基盤は `src/foundation/` を使用しなければならない（MUST）
- バリデーションは `@/foundation/validation/runtime` の `validate()` を使用する
- API レスポンスは `@/foundation/errors/response` の `success()` / `error()` でラップする

**根拠**: テンプレートに従うことで、実装の一貫性を保ち、
レビューコストを削減し、新規参画者の学習曲線を緩和する。

### II. ドメイン分離

- 各ドメインは `src/domains/[domain]/` に独立して実装しなければならない（MUST）
- ドメインディレクトリは `types/`・`api/`・`ui/` のサブディレクトリで構成する
- ドメイン間の依存は API 経由のみとし、直接 import してはならない（MUST NOT）
- `src/contracts/` に定義されたインターフェースに準拠しなければならない（MUST）

**根拠**: ドメイン境界を明確にすることで、
各機能を独立して開発・テスト・デプロイ可能にする。

### III. テストファースト（非交渉）

- TDD（Red → Green → Refactor）を徹底しなければならない（MUST）
- テストを先に記述し、失敗を確認してから実装に着手する（Red フェーズの省略は禁止）
- 各ユースケースにテストタスクを含めなければならない（MUST）
- テストカバレッジ 80% 以上を維持しなければならない（MUST）
- 本番 E2E テストは `tests/e2e/` 直下に配置する
- E2E テスト作成時は `src/samples/tests/e2e/domains/` 配下のサンプルを参照する

**根拠**: Red フェーズを省略すると、テストが実装を検証していない
偽陽性を見逃すリスクがある。厳格な TDD サイクルにより、
テストの信頼性と実装の正確性を同時に担保する。

### IV. 実装ワークフロー

- `src/domains/` のスタブ（API: NotImplementedError → 501 応答、UI: 「ドメイン未実装」プレースホルダー）を本番実装に置き換える
- 既存ドメイン（catalog, cart, orders）の本番ページ（`src/app/(buyer)/`、`src/app/admin/`）と API Routes（`src/app/api/`）は配置済み。`@/domains/` のスタブを置換すればページと API が自動的に動作する
- `src/contracts/` に準拠し、`src/samples/` を参考に実装する
- **spec.md に定義されていない機能は実装してはならない（MUST NOT）**。samples や他ドメインに含まれる機能であっても、現在の仕様のスコープ外であれば除外する
- ユーザーストーリー単位でフェーズを分割し、各ストーリーを独立して実装・テスト可能にしなければならない（MUST）
- ドメイン実装時にレイアウトファイルの navLinks のコメントを解除してナビゲーションリンクを有効化する:
  - 購入者向け: `src/app/(buyer)/layout.tsx` の navLinks（例: `{ href: '/catalog', label: '商品一覧' }`）
  - 管理者向け: `src/app/admin/layout.tsx` の navLinks（例: `{ href: '/admin/products', label: '商品管理' }`）
  - navLinks はデフォルトで空（購入者）またはダッシュボードのみ（管理者）。実装したドメインのリンクのみ有効化する
  - navLinks を変更する際は、spec.md のスコープに含まれないリンクやページが残っていないか監査しなければならない（MUST）

**根拠**: スタブ置換パターンにより、ページルーティングと API 構造を
事前に確定し、ドメインロジックの実装に集中できる。
スコープ外機能の除外ルールは、仕様の肥大化を防ぐ。

## 品質基準・命名規約

### 品質基準

| 項目 | 基準 |
|------|------|
| TypeScript | strict モード、エラー 0 件 |
| ESLint | エラー 0 件 |
| テストカバレッジ | 80% 以上 |
| E2E テスト | 主要導線をカバー |
| パフォーマンス | 一覧ページ初回ロード 3 秒以内 |

### 命名規約

| 対象 | 規約 | 例 |
|------|------|----|
| ファイル名 | kebab-case | `product-list.tsx` |
| コンポーネント | PascalCase | `ProductList` |
| 関数 | camelCase | `getProducts` |
| 定数 | UPPER_SNAKE_CASE | `MAX_ITEMS` |
| 型 | PascalCase | `ProductType` |

### 技術スタック

- Next.js 14 (App Router)
- TypeScript 5 (strict mode)
- React 18
- Tailwind CSS 3
- Zod（バリデーション）
- Vitest（単体・統合テスト）
- Playwright（E2E テスト）

## 認証・認可・E2Eテスト注意事項

### 認証・認可

- ロール: buyer（購入者）、admin（管理者）
- セッション管理: Cookie ベース
- 認可: RBAC（Role-Based Access Control）

### E2Eテスト実行時の注意事項

- E2E テスト実行前にポート 3000 を占有している既存プロセスを停止しなければならない（MUST）
- Windows 環境では Bash の `$_` が extglob で壊れるため、PowerShell スクリプトは `powershell.exe -File -` + heredoc で実行する
- データ変更後は `.next` キャッシュを削除してからサーバーを再起動しなければならない（MUST）（`globalThis` のインメモリストアが HMR で残るため）

## ガバナンス

- 本憲章はプロジェクトの全実装・レビュー・仕様策定に優先する
- 憲章の改定には以下を必要とする:
  1. 改定内容の文書化
  2. 影響を受けるテンプレート・仕様書の同期更新
  3. セマンティックバージョニングに基づくバージョン更新
    - MAJOR: 原則の削除・再定義など後方互換性のない変更
    - MINOR: 新原則・セクションの追加、既存原則の実質的拡張
    - PATCH: 表現の明確化・誤字修正・非意味的な調整
- すべての PR・コードレビューは本憲章への準拠を検証しなければならない（MUST）
- 複雑性の追加は明示的な根拠を必要とする
- すべての仕様書・計画・タスク・実装ドキュメントは日本語で記述しなければならない（MUST）

**Version**: 1.0.0 | **Ratified**: 2026-02-09 | **Last Amended**: 2026-02-09
