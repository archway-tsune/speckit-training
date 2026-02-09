# リサーチ: 商品管理機能

## 調査 1: CQRS 分離アプローチ

### 判断

product ドメイン（書き込み）を新規作成し、catalog ドメイン（読み取り）は読み取り専用にリファクタリングする。contract・リポジトリ・API Routes を明確に分離する。

### 根拠

- 仕様書の前提条件: 「商品管理は catalog ドメインとは異なるバウンデッドコンテキストのため、独立した product ドメインとして実装する」
- 憲章 II. ドメイン分離: 「各ドメインは `src/domains/[domain]/` に独立して実装しなければならない」
- 同一リポジトリ（`productRepository`）を共有するが、ドメイン層では異なるコンテキスト・異なるユースケースとして参照する

### 検討した代替案

1. **catalog ドメインに CRUD を追加**: 簡単だが、読み取り専用（購入者向け）と書き込み（管理者向け）の責務が混在し、ドメイン分離の原則に違反
2. **完全なリポジトリ分離（別テーブル/別ストア）**: 過剰な複雑性。インメモリストアは1つで十分

---

## 調査 2: contract の分離方法

### 判断

`src/contracts/product.ts` を新規作成する。ただし `Product` エンティティスキーマと `ProductRepository` インターフェースは `src/contracts/catalog.ts` から再エクスポートして共有する。CRUD 操作用のスキーマ（`CreateProductInput` 等）は `product.ts` に移動し、`catalog.ts` からは削除する。

### 根拠

- Product エンティティと ProductRepository は catalog（読み取り）と product（書き込み）の両方で使用する共有定義
- CRUD 操作のスキーマは管理者の書き込み操作にのみ使用されるため、product ドメインに帰属
- catalog.ts は読み取り専用操作（GetProducts, GetProductById）のスキーマのみ保持

### 検討した代替案

1. **全スキーマを catalog.ts に残して import**: 書き込みスキーマが catalog に残り責務が不明瞭
2. **shared.ts に共通型を切り出し**: エンティティスキーマだけのために新ファイルは過剰

---

## 調査 3: API Routes の構成

### 判断

管理者向け商品管理 API は `/api/products/` に新規作成する。既存の `/api/catalog/products/` は購入者向け読み取り専用に残す。

### 根拠

- URL の意味的分離: `/api/catalog/products/` は購入者向けカタログ閲覧、`/api/products/` は管理者向け商品管理
- 既存 catalog API Routes の POST/PUT/DELETE ハンドラは catalog ドメインの `NotImplementedError` スタブを呼んでいる。これらを削除し、product ドメインの API Routes に集約する
- catalog API Routes は GET のみ残す（読み取り専用化）

### 検討した代替案

1. **既存 `/api/catalog/products/` の POST/PUT/DELETE を product ドメインに接続**: URL 構造が catalog なのに product ドメインを呼ぶのは紛らわしい
2. **`/api/admin/products/`**: admin はロール制御であり URL パスに含める必要なし（authorize で制御）

---

## 調査 4: catalog ドメインの読み取り専用リファクタリング

### 判断

`src/domains/catalog/api/index.ts` から `createProduct`、`updateProduct`、`deleteProduct` スタブと `NotImplementedError` クラスを削除する。`src/app/api/catalog/products/route.ts` の POST ハンドラと `[id]/route.ts` の PUT/DELETE ハンドラも削除する。

### 根拠

- catalog ドメインの責務は「購入者向けの商品閲覧」のみ
- 書き込み操作は product ドメインに完全移管
- 憲章 IV: 「spec.md に定義されていない機能は実装してはならない」— catalog の仕様には CRUD は含まれない

### 検討した代替案

1. **スタブを残す**: 不要なコードが残り、保守性が低下
2. **catalog ドメインごと削除**: 購入者向け閲覧は引き続き必要

---

## 調査 5: リポジトリ層の共有方法

### 判断

既存の `src/infrastructure/repositories/product.ts` の `productRepository` を catalog と product の両ドメインで共有する。`src/infrastructure/repositories/index.ts` からのエクスポートはそのまま維持する。

### 根拠

- 同一データストア（インメモリ `globalThis.__productStore`）に対する操作
- リポジトリの分離は CQRS パターンでは不要（書き込みモデルと読み取りモデルが同じ構造）
- ドメイン層で責務を分離し、リポジトリ層は共有する

### 検討した代替案

1. **読み取り専用リポジトリインターフェースを定義**: catalog 側で findAll/findById/count のみのインターフェースを使用する案。適切だが現段階では過剰
