# ドメイン実装

このディレクトリには、本番用のドメイン実装を配置します。
`src/app/` は `@/domains/` 経由でドメインロジックをインポートします。

## スタブ実装

初期状態では、以下のドメインにスタブ実装が配置されています。
API は `NotImplementedError` をスロー、UI は「ドメイン未実装」プレースホルダーを表示します。
本番実装で置き換える前提です。`@/samples/` への依存はありません。

```
src/domains/
├── catalog/
│   ├── api/index.ts    # NotImplementedError スタブ（getProducts, createProduct 等）
│   └── ui/index.tsx    # プレースホルダー（ProductList, ProductDetail）
├── cart/
│   ├── api/index.ts    # NotImplementedError スタブ（getCart, addToCart 等）
│   └── ui/index.tsx    # プレースホルダー（CartView）
└── orders/
    ├── api/index.ts    # NotImplementedError スタブ（getOrders, createOrder 等）
    └── ui/index.tsx    # プレースホルダー（OrderList, OrderDetail）
```

### 本番実装への置き換え方法

スタブの `index.ts` / `index.tsx` を独自実装に置き換えてください。

**置き換え前**（スタブ）:
```typescript
// src/domains/catalog/api/index.ts
export function getProducts(..._args: unknown[]): never {
  throw new NotImplementedError('catalog', 'getProducts');
}
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

- 本番 `src/app/` は `@/domains/` 経由でインポートします（`@/samples/` を直接参照しません）
- サンプル `src/app/(samples)/sample/` は `@/samples/domains/` を直接インポートします
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

詳細は `docs/GETTING_STARTED.md` を参照してください。
