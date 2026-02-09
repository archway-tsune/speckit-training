# ec-site-arch Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-07

## Active Technologies
- TypeScript 5 + React 18 + Next.js 14 (App Router), Vitest 1.6, Playwright 1.45, React Testing Library 16 (004-consolidate-sample-tests)
- N/A（ナビゲーション定義の変更のみ） (005-nav-control)
- YAML (GitHub Actions), PowerShell 5.1+, Bash (GitHub Actions runner) + GitHub Actions (`actions/checkout@v4`, `actions/setup-node@v4`), GitHub CLI (`gh`) (006-release-automation)
- TypeScript 5 + React 18 + Next.js 14 (App Router) + Next.js App Router, Tailwind CSS 3 (007-separate-sample-production)
- N/A（インメモリストアは `@/infrastructure/` に配置済み、変更なし） (007-separate-sample-production)



## Project Structure

```text
src/
  app/                    # 本番ページ・API Routes（@/domains/ 経由）
    (samples)/sample/     # サンプルページ・API Routes（/sample/* URL）
  contracts/              # 共有インターフェース
  domains/                # ドメインスタブ（NotImplementedError）
  foundation/             # 共通基盤（認証・エラー・バリデーション）
  infrastructure/         # リポジトリ実装
  samples/domains/        # サンプルドメイン実装
  samples/tests/          # サンプルテスト（unit/integration/e2e）
  templates/              # UIテンプレート
tests/
```

## Commands

# Add commands for 

## Code Style

General: Follow standard conventions

## Recent Changes
- 007-separate-sample-production: Added TypeScript 5 + React 18 + Next.js 14 (App Router) + Next.js App Router, Tailwind CSS 3
- 006-release-automation: Added YAML (GitHub Actions), PowerShell 5.1+, Bash (GitHub Actions runner) + GitHub Actions (`actions/checkout@v4`, `actions/setup-node@v4`), GitHub CLI (`gh`)



<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
