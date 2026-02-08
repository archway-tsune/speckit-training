# ドメイン実装

このディレクトリには、本番用のドメイン実装を配置します。
`src/app/` は `@/domains/` 経由でドメインロジックをインポートします。

## 暫定スキャフォールド

初期状態では、以下のドメインに暫定スキャフォールドが配置されています。
これらは `@/samples/` の再エクスポートであり、本番実装で置き換える前提です。

```
src/domains/
├── catalog/
│   ├── api/index.ts    # @/samples/domains/catalog/api を再エクスポート
│   └── ui/index.ts     # @/samples/domains/catalog/ui を再エクスポート
├── cart/
│   ├── api/index.ts    # @/samples/domains/cart/api を再エクスポート
│   └── ui/index.ts     # @/samples/domains/cart/ui を再エクスポート
└── orders/
    ├── api/index.ts    # @/samples/domains/orders/api を再エクスポート
    └── ui/index.ts     # @/samples/domains/orders/ui を再エクスポート
```

### 本番実装への置き換え方法

暫定スキャフォールドの `index.ts` を独自実装に置き換えてください。

**置き換え前**（暫定スキャフォールド）:
```typescript
// src/domains/catalog/api/index.ts
export { getProducts, getProductById, ... } from '@/samples/domains/catalog/api';
```

**置き換え後**（本番実装）:
```typescript
// src/domains/catalog/api/index.ts
export { getProducts, getProductById, ... } from './usecases';
```

## ディレクトリ構成

新規ドメインを追加する場合は、以下の構成に従ってください:

```
src/domains/
└── {domain-name}/
    ├── api/           # ユースケース（ビジネスロジック）
    │   ├── usecases.ts
    │   └── index.ts
    ├── ui/            # UIコンポーネント
    │   ├── {Component}.tsx
    │   └── index.ts
    └── tests/         # テスト
        ├── unit/
        │   ├── usecase.test.ts
        │   └── ui.test.tsx
        └── integration/
            └── api.test.ts
```

## 依存関係

```
src/app/ ──→ @/domains/        （ドメインロジック）
src/infrastructure/ ──→ @/contracts/  （共有インターフェースのみ）
src/samples/ ──→ @/contracts/         （独立した参照コード）
```

- `src/app/` は常に `@/domains/` 経由でインポートします（`@/samples/` を直接参照しません）
- `src/infrastructure/` は `@/contracts/` の共有インターフェース（ProductRepository 等）のみに依存します
- サンプル実装は `src/samples/domains/` にあり、独立した参照コードとして利用できます

## 利用可能なテンプレート

テンプレートは `src/templates/` からインポートできます:

```typescript
// ユースケーステンプレート
import { createUseCase } from '@/templates/api/usecase';

// UIテンプレート
import { ListPage, DetailPage, FormPage } from '@/templates/ui/pages';
import { Loading, Error, Empty } from '@/templates/ui/components/status';

// リポジトリテンプレート
import { createInMemoryStore, createCrudRepository } from '@/templates/infrastructure/repository';
```

## 実装手順

1. `src/contracts/` に共有インターフェース（DTO・リポジトリ契約）を定義
2. `src/domains/{domain-name}/` ディレクトリを作成
3. ユースケースを `api/usecases.ts` に実装
4. UIコンポーネントを `ui/` に実装
5. `api/index.ts` と `ui/index.ts` で公開APIをエクスポート
6. `src/infrastructure/` にリポジトリを実装（`@/contracts/` のインターフェースを実装）
7. テストを `tests/` に実装
8. ルーティングを `src/app/` に追加（`@/domains/` 経由でインポート）

詳細は `specs/001-ec-arch-foundation/quickstart.md` を参照してください。
