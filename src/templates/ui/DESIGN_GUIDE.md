# UIデザインガイド

ECサイト向けアーキテクチャ基盤のUIデザイン指針。

## 設計原則

### 1. レイアウト原則

- **モジュール式グリッドシステム**を採用
- Tailwind CSS のグリッドクラスを活用（`grid-cols-2`, `grid-cols-3`）
- レスポンシブ対応（`sm:`, `md:`, `lg:` プレフィックス）

### 2. 余白原則

- セクション間の余白: **2〜2.4rem**（`py-8` または `py-section`）
- 要素間の余白: **1〜1.5rem**（`gap-4` または `gap-6`）
- 「呼吸感」のある余裕を持たせる

### 3. 情報設計原則

- 商品情報と購入導線を最優先
- 補足情報は控えめに配置
- 不要な視覚要素の徹底的な排除

### 4. インタラクション原則

- シンプルで予測可能なナビゲーション
- 明確なCTA配置と十分なタッチ領域（最小44px）
- 状態遷移の視覚的フィードバック

## カラーパレット

| 用途 | Tailwind クラス | 説明 |
|------|-----------------|------|
| 背景 | `bg-base-50` | オフホワイト (#fafaf2) |
| 背景（薄） | `bg-base-100` | やや暗いオフホワイト (#f5f5e8) |
| テキスト | `text-base-900` | ダークグレー (#1a1a1a) |
| テキスト（薄） | `text-base-900/70` | 70%透明度のダークグレー |
| アクセント | `bg-accent` | イエロー (#ffd879) |
| アクセント（ホバー） | `hover:bg-accent-hover` | 濃いイエロー (#ffcc4d) |

## タイポグラフィ

```css
/* 見出し */
font-family: 'Inter', 'Noto Sans JP', sans-serif;
font-weight: 700;

/* 本文 */
font-family: 'Inter', 'Noto Sans JP', sans-serif;
font-weight: 400;

/* 装飾見出し */
font-family: 'Playfair Display', 'Noto Serif JP', serif;

/* コード */
font-family: 'JetBrains Mono', monospace;
```

### フォントサイズ

| 用途 | Tailwind クラス |
|------|-----------------|
| 大見出し | `text-2xl` または `text-3xl` |
| 中見出し | `text-xl` |
| 小見出し | `text-lg` |
| 本文 | `text-base` |
| 補足 | `text-sm` |
| 注釈 | `text-xs` |

## コンポーネント設計

### ボタン

```tsx
// プライマリボタン
<button className="rounded-md bg-base-900 px-6 py-2 text-sm font-medium text-base-50 hover:bg-base-900/90">
  送信
</button>

// セカンダリボタン
<button className="rounded-md border border-base-900/20 px-6 py-2 text-sm font-medium text-base-900 hover:bg-base-100">
  キャンセル
</button>

// 無効状態
<button disabled className="... disabled:cursor-not-allowed disabled:opacity-50">
  送信中...
</button>
```

### 入力フィールド

```tsx
<input
  type="text"
  className="w-full rounded-md border border-base-900/20 px-4 py-2 text-base-900 placeholder:text-base-900/40 focus:border-base-900 focus:outline-none focus:ring-1 focus:ring-base-900"
  placeholder="入力してください"
/>
```

### カード

```tsx
<div className="rounded-lg border border-base-900/10 bg-white p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-base-900">タイトル</h3>
  <p className="mt-2 text-base-900/70">説明文</p>
</div>
```

## 状態表示

### ローディング

- スピナーアニメーション（`animate-spin`）
- 「読み込み中...」メッセージ
- `role="status"` で支援技術に通知

### エラー

- 赤色のアイコンと背景（`bg-red-100`, `text-red-600`）
- 明確なエラーメッセージ
- リトライボタン（任意）
- `role="alert"` で支援技術に通知

### 空状態

- 中央配置のアイコンとメッセージ
- アクションボタン（任意）
- `role="status"` で支援技術に通知

## アクセシビリティ

### 必須要件

1. **十分なコントラスト比**: テキストは4.5:1以上
2. **フォーカス表示**: `focus:ring-2 focus:ring-offset-2`
3. **ARIA属性**:
   - `role="status"` - 状態表示
   - `role="alert"` - エラー表示
   - `aria-label` - アイコンボタン
4. **キーボード操作**: すべてのインタラクティブ要素にフォーカス可能

### テスト

```tsx
// アクセシビリティテストの例
it('適切なARIAラベルが設定されている', () => {
  render(<MyComponent />);
  expect(screen.getByRole('button')).toHaveAccessibleName('送信');
});
```

## レスポンシブ設計

### ブレークポイント

| プレフィックス | 最小幅 | 用途 |
|---------------|--------|------|
| なし | 0px | モバイル（デフォルト） |
| `sm:` | 640px | 大きめのモバイル |
| `md:` | 768px | タブレット |
| `lg:` | 1024px | 小さめのデスクトップ |
| `xl:` | 1280px | デスクトップ |

### モバイルファースト

```tsx
// モバイルファーストの例
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* グリッドアイテム */}
</div>
```

### 確認ダイアログ

```tsx
// デフォルト（プライマリボタン）
import { ConfirmDialog } from '@/templates/ui/components/dialog';

<ConfirmDialog
  open={isOpen}
  message="この操作を実行しますか？"
  onConfirm={handleConfirm}
  onCancel={() => setIsOpen(false)}
/>

// 危険な操作（赤いボタン）
<ConfirmDialog
  open={isOpen}
  title="商品の削除"
  message="この商品をカートから削除しますか？"
  confirmLabel="削除する"
  variant="danger"
  onConfirm={handleDelete}
  onCancel={() => setIsOpen(false)}
/>
```

- `role="dialog"` + `aria-modal="true"` で支援技術に通知
- Escapeキーまたはオーバーレイクリックで閉じる
- キャンセルボタンに自動フォーカス

## ナビゲーション

### ページネーション

```tsx
import { Pagination } from '@/templates/ui/components/navigation';

// 一覧画面のページネーション
<Pagination
  page={1}
  limit={10}
  total={50}
  totalPages={5}
  onPageChange={(page) => setCurrentPage(page)}
/>
// → 「全50件中 1〜10件を表示」+ 前へ/次へボタン
// → total=0 または totalPages=1 の場合は非表示
```

- `aria-label="ページネーション"` でナビゲーションロールを提供
- 1ページ目では「前へ」ボタンが無効化
- 最終ページでは「次へ」ボタンが無効化

## データ表示

### ステータスバッジ

```tsx
import { StatusBadge } from '@/templates/ui/components/data-display';

// ドメインごとにステータス色とラベルを定義
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  pending: '保留中',
  confirmed: '確認済み',
  shipped: '発送済み',
};

<StatusBadge
  status={order.status}
  statusColors={statusColors}
  statusLabels={statusLabels}
/>
// → 未定義ステータスは bg-base-100 text-base-900 でそのまま表示
```

- `role="status"` で支援技術に通知
- `rounded-full` のピル型バッジ

### 画像プレースホルダー

```tsx
import { ImagePlaceholder } from '@/templates/ui/components/data-display';

// 画像URLがある場合は画像を表示、ない場合はSVGプレースホルダー
<ImagePlaceholder
  src={product.imageUrl}
  alt={product.name}
  size="md"
/>
```

| サイズ | Tailwind クラス | ピクセル |
|--------|-----------------|---------|
| `sm` | `w-16 h-16` | 64px |
| `md` | `w-24 h-24` | 96px（デフォルト） |
| `lg` | `w-64 h-64` | 256px |

## フォーム（拡張）

### 検索バー

```tsx
import { SearchBar } from '@/templates/ui/components/form';

<SearchBar
  onSearch={(query) => handleSearch(query)}
  defaultValue={currentQuery}
  placeholder="商品名で検索..."
/>
// → Enter キーで検索実行
// → クリアボタンで入力をリセットし onSearch('') を呼び出し
```

- `role="search"` で検索ランドマークを提供
- クリアボタンは入力値がある場合のみ表示

### 数量セレクター

```tsx
import { QuantitySelector } from '@/templates/ui/components/form';

<QuantitySelector
  value={item.quantity}
  min={1}
  max={item.stock}
  onChange={(qty) => updateQuantity(item.id, qty)}
  disabled={isUpdating}
/>
// → -/+ ボタンで数量変更
// → min/max でボタン無効化
// → min > max の場合は全コントロール無効化
```

- `aria-live="polite"` で数値変更を支援技術に通知
- 各ボタンに `aria-label` 設定

## ユーティリティ関数

### 価格フォーマット

```tsx
import { formatPrice } from '@/templates/ui/utils';

formatPrice(1000);   // → '¥1,000'
formatPrice(0);      // → '無料'
formatPrice(15800);  // → '¥15,800'
formatPrice(-500);   // → '-¥500'
```

### 日時フォーマット

```tsx
import { formatDateTime } from '@/templates/ui/utils';

formatDateTime('2026-02-07T14:30:00');  // → '2026/2/7 14:30'
formatDateTime(new Date());              // → '2026/2/7 10:00'
formatDateTime('invalid');               // → '-'
```

## ファイル構成

```
src/templates/ui/
├── components/
│   ├── layout/         # レイアウト関連
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   ├── status/         # 状態表示
│   │   ├── Loading.tsx
│   │   ├── Error.tsx
│   │   └── Empty.tsx
│   ├── dialog/         # ダイアログ
│   │   └── ConfirmDialog.tsx
│   ├── auth/           # 認証関連
│   │   └── Forbidden.tsx
│   ├── navigation/     # ナビゲーション
│   │   └── Pagination.tsx
│   ├── data-display/   # データ表示
│   │   ├── StatusBadge.tsx
│   │   └── ImagePlaceholder.tsx
│   └── form/           # フォーム
│       ├── FormField.tsx
│       ├── SearchBar.tsx
│       └── QuantitySelector.tsx
├── utils/
│   ├── events.ts       # カスタムイベント
│   └── format.ts       # 価格・日時フォーマット
├── pages/              # 画面テンプレート
│   ├── list.tsx
│   ├── detail.tsx
│   └── form.tsx
└── DESIGN_GUIDE.md     # 本ファイル
```
