/**
 * UIコンポーネント単体テスト テンプレート
 * TDD: RED → GREEN → REFACTOR
 *
 * このテンプレートは新しいUIコンポーネントのテストを書く際の雛形です。
 * 必要に応じてコピーして使用してください。
 *
 * テスト観点:
 * - 表示状態: loading/error/empty/data状態の表示確認
 * - ユーザーインタラクション: クリック、入力などの操作確認
 * - アクセシビリティ: 適切なARIAラベル、キーボード操作の確認
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// --- 以下はサンプルコンポーネント ---
// 実際のコンポーネントに置き換えてください

/**
 * サンプルProps型
 */
interface SampleComponentProps {
  /** ローディング状態 */
  loading?: boolean;
  /** エラー状態 */
  error?: string | null;
  /** データ */
  items?: Array<{ id: string; name: string }>;
  /** クリックハンドラ */
  onItemClick?: (id: string) => void;
}

/**
 * サンプルコンポーネント
 */
function SampleComponent({
  loading = false,
  error = null,
  items = [],
  onItemClick,
}: SampleComponentProps) {
  if (loading) {
    return (
      <div role="status" aria-label="読み込み中">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" aria-label="エラー">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div role="status" aria-label="データなし">
        データがありません
      </div>
    );
  }

  return (
    <ul role="list" aria-label="アイテムリスト">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onItemClick?.(item.id)}
            aria-label={`${item.name}を選択`}
          >
            {item.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

// --- テスト本体 ---

describe('[コンポーネント名] コンポーネント', () => {
  // ユーザーイベントのセットアップ
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('表示状態', () => {
    describe('loading状態', () => {
      it('Given loading=true, When レンダリング, Then ローディング表示', () => {
        // Arrange & Act
        render(<SampleComponent loading={true} />);

        // Assert
        expect(screen.getByRole('status', { name: '読み込み中' })).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    describe('error状態', () => {
      it('Given error="エラーメッセージ", When レンダリング, Then エラー表示', () => {
        // Arrange & Act
        render(<SampleComponent error="エラーが発生しました" />);

        // Assert
        expect(screen.getByRole('alert', { name: 'エラー' })).toBeInTheDocument();
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      });
    });

    describe('empty状態', () => {
      it('Given items=[], When レンダリング, Then 空状態表示', () => {
        // Arrange & Act
        render(<SampleComponent items={[]} />);

        // Assert
        expect(screen.getByRole('status', { name: 'データなし' })).toBeInTheDocument();
        expect(screen.getByText('データがありません')).toBeInTheDocument();
      });
    });

    describe('data状態', () => {
      it('Given items配列, When レンダリング, Then アイテムリスト表示', () => {
        // Arrange
        const items = [
          { id: '1', name: 'アイテム1' },
          { id: '2', name: 'アイテム2' },
        ];

        // Act
        render(<SampleComponent items={items} />);

        // Assert
        expect(screen.getByRole('list', { name: 'アイテムリスト' })).toBeInTheDocument();
        expect(screen.getByText('アイテム1')).toBeInTheDocument();
        expect(screen.getByText('アイテム2')).toBeInTheDocument();
      });
    });
  });

  describe('ユーザーインタラクション', () => {
    it('Given アイテムリスト, When アイテムをクリック, Then onItemClickが呼ばれる', async () => {
      // Arrange
      const items = [{ id: '1', name: 'アイテム1' }];
      const onItemClick = vi.fn();

      render(<SampleComponent items={items} onItemClick={onItemClick} />);

      // Act
      await user.click(screen.getByRole('button', { name: 'アイテム1を選択' }));

      // Assert
      expect(onItemClick).toHaveBeenCalledWith('1');
      expect(onItemClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('アクセシビリティ', () => {
    it('Given アイテムリスト, When レンダリング, Then 適切なARIAラベルが設定されている', () => {
      // Arrange
      const items = [{ id: '1', name: 'アイテム1' }];

      // Act
      render(<SampleComponent items={items} />);

      // Assert
      expect(screen.getByRole('list')).toHaveAccessibleName('アイテムリスト');
      expect(screen.getByRole('button')).toHaveAccessibleName('アイテム1を選択');
    });

    it('Given ローディング状態, When レンダリング, Then status roleが設定されている', () => {
      // Arrange & Act
      render(<SampleComponent loading={true} />);

      // Assert
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('Given エラー状態, When レンダリング, Then alert roleが設定されている', () => {
      // Arrange & Act
      render(<SampleComponent error="エラー" />);

      // Assert
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// インタラクティブUIコンポーネント テストパターン
// ─────────────────────────────────────────────────────────────────
//
// 以下は、ボタン操作・キーボード入力・状態バリアント・条件付き表示・
// サイズバリアント等のテストパターンの雛形です。
// 実際のコンポーネントに合わせてコピー・修正して使用してください。
//
// パターン一覧:
// 1. ボタンクリックによるコールバック呼び出し（QuantitySelector パターン）
// 2. キーボード操作テスト（SearchBar の Enter キーパターン）
// 3. 状態バリアントによるスタイル切り替え（StatusBadge パターン）
// 4. 条件付き表示/非表示（Pagination の total=0 パターン）
// 5. サイズバリアントテスト（ImagePlaceholder の sm/md/lg パターン）

/*
// --- パターン1: ボタンクリックによるコールバック呼び出し ---
// 例: 数量セレクターの +/- ボタン

describe('ボタン操作', () => {
  it('Given 初期値, When +ボタンを押す, Then onChange(value+1) が呼ばれる', async () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={3} min={1} max={10} onChange={onChange} />);

    await user.click(screen.getByTestId('quantity-increment'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('Given 最大値, When +ボタンを押す, Then ボタンが無効化されている', () => {
    render(<QuantitySelector value={10} min={1} max={10} onChange={vi.fn()} />);
    expect(screen.getByTestId('quantity-increment')).toBeDisabled();
  });

  it('Given disabled=true, When レンダリング, Then 全コントロールが無効化されている', () => {
    render(<QuantitySelector value={3} min={1} max={10} onChange={vi.fn()} disabled />);
    expect(screen.getByTestId('quantity-increment')).toBeDisabled();
    expect(screen.getByTestId('quantity-decrement')).toBeDisabled();
  });
});

// --- パターン2: キーボード操作テスト ---
// 例: 検索バーの Enter キーで検索実行

describe('キーボード操作', () => {
  it('Given テキスト入力済み, When Enterキーを押す, Then onSearchが入力テキストで呼ばれる', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByTestId('search-input');
    await user.type(input, 'テスト商品{Enter}');

    expect(onSearch).toHaveBeenCalledWith('テスト商品');
  });

  it('Given テキスト入力済み, When クリアボタンを押す, Then 入力がリセットされonSearchが空文字列で呼ばれる', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} defaultValue="初期値" />);

    await user.click(screen.getByTestId('search-clear'));

    expect(onSearch).toHaveBeenCalledWith('');
    expect(screen.getByTestId('search-input')).toHaveValue('');
  });
});

// --- パターン3: 状態バリアントによるスタイル切り替え ---
// 例: ステータスバッジの色・ラベル変更

describe('状態バリアント', () => {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
  };
  const statusLabels: Record<string, string> = {
    pending: '保留中',
    confirmed: '確認済み',
  };

  it('Given 定義済みステータス, When レンダリング, Then 対応する色とラベルが表示される', () => {
    render(<StatusBadge status="pending" statusColors={statusColors} statusLabels={statusLabels} />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('保留中');
    expect(badge.className).toContain('bg-yellow-100');
  });

  it('Given 未定義ステータス, When レンダリング, Then デフォルトスタイルでステータス値がそのまま表示される', () => {
    render(<StatusBadge status="unknown" statusColors={statusColors} statusLabels={statusLabels} />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('unknown');
    expect(badge.className).toContain('bg-base-100');
  });
});

// --- パターン4: 条件付き表示/非表示 ---
// 例: ページネーションの total=0 で非表示

describe('条件付き表示/非表示', () => {
  it('Given total=0, When レンダリング, Then コンポーネントが非表示になる', () => {
    const { container } = render(
      <Pagination page={1} limit={10} total={0} totalPages={0} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('Given totalPages=1, When レンダリング, Then コンポーネントが非表示になる', () => {
    const { container } = render(
      <Pagination page={1} limit={10} total={5} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('Given 正常なデータ, When レンダリング, Then 表示テキストが正しい', () => {
    render(<Pagination page={1} limit={10} total={50} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('全50件中 1〜10件を表示');
  });
});

// --- パターン5: サイズバリアントテスト ---
// 例: 画像プレースホルダーの sm/md/lg

describe('サイズバリアント', () => {
  it('Given size="sm", When レンダリング, Then 小サイズで表示される', () => {
    render(<ImagePlaceholder alt="テスト" size="sm" />);
    const el = screen.getByTestId('image-placeholder');
    expect(el.className).toContain('w-16');
    expect(el.className).toContain('h-16');
  });

  it('Given size="md"（デフォルト）, When レンダリング, Then 中サイズで表示される', () => {
    render(<ImagePlaceholder alt="テスト" />);
    const el = screen.getByTestId('image-placeholder');
    expect(el.className).toContain('w-24');
    expect(el.className).toContain('h-24');
  });

  it('Given size="lg", When レンダリング, Then 大サイズで表示される', () => {
    render(<ImagePlaceholder alt="テスト" size="lg" />);
    const el = screen.getByTestId('image-placeholder');
    expect(el.className).toContain('w-64');
    expect(el.className).toContain('h-64');
  });

  it('Given src指定あり, When レンダリング, Then img要素が表示される', () => {
    render(<ImagePlaceholder src="https://example.com/image.jpg" alt="テスト画像" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(img).toHaveAttribute('alt', 'テスト画像');
  });

  it('Given src未指定, When レンダリング, Then SVGプレースホルダーが表示される', () => {
    render(<ImagePlaceholder alt="テスト画像" />);
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
*/
