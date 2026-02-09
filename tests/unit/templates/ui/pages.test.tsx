/**
 * 画面テンプレート 単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ListPage } from '@/templates/ui/pages/list';
import { DetailPage } from '@/templates/ui/pages/detail';
import { FormPage } from '@/templates/ui/pages/form';

describe('画面テンプレート', () => {
  const user = userEvent.setup();

  describe('ListPage - 一覧画面テンプレート', () => {
    it('Given タイトル, When レンダリング, Then タイトルが表示される', () => {
      // Act
      render(<ListPage title="商品一覧" items={[]} />);

      // Assert
      expect(screen.getByRole('heading', { name: '商品一覧' })).toBeInTheDocument();
    });

    it('Given items, When レンダリング, Then アイテムリストが表示される', () => {
      // Arrange
      const items = [
        { id: '1', name: 'アイテム1' },
        { id: '2', name: 'アイテム2' },
      ];
      const renderItem = (item: { id: string; name: string }) => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          {item.name}
        </div>
      );

      // Act
      render(<ListPage title="一覧" items={items} renderItem={renderItem} />);

      // Assert
      expect(screen.getByTestId('item-1')).toHaveTextContent('アイテム1');
      expect(screen.getByTestId('item-2')).toHaveTextContent('アイテム2');
    });

    it('Given loading=true, When レンダリング, Then ローディング表示', () => {
      // Act
      render(<ListPage title="一覧" items={[]} loading={true} />);

      // Assert
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('Given error, When レンダリング, Then エラー表示', () => {
      // Act
      render(<ListPage title="一覧" items={[]} error="エラーが発生しました" />);

      // Assert
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });

    it('Given items=[], When レンダリング, Then 空状態表示', () => {
      // Act
      render(<ListPage title="一覧" items={[]} emptyMessage="データがありません" />);

      // Assert
      expect(screen.getByText('データがありません')).toBeInTheDocument();
    });
  });

  describe('DetailPage - 詳細画面テンプレート', () => {
    it('Given タイトル, When レンダリング, Then タイトルが表示される', () => {
      // Act
      render(
        <DetailPage title="商品詳細">
          <div>コンテンツ</div>
        </DetailPage>
      );

      // Assert
      expect(screen.getByRole('heading', { name: '商品詳細' })).toBeInTheDocument();
    });

    it('Given children, When レンダリング, Then childrenが表示される', () => {
      // Act
      render(
        <DetailPage title="詳細">
          <div data-testid="content">詳細コンテンツ</div>
        </DetailPage>
      );

      // Assert
      expect(screen.getByTestId('content')).toHaveTextContent('詳細コンテンツ');
    });

    it('Given loading=true, When レンダリング, Then ローディング表示', () => {
      // Act
      render(
        <DetailPage title="詳細" loading={true}>
          <div>コンテンツ</div>
        </DetailPage>
      );

      // Assert
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('Given backUrl, When レンダリング, Then 戻るボタンが表示される', () => {
      // Act
      render(
        <DetailPage title="詳細" backUrl="/list">
          <div>コンテンツ</div>
        </DetailPage>
      );

      // Assert
      expect(screen.getByRole('link', { name: '戻る' })).toHaveAttribute('href', '/list');
    });
  });

  describe('FormPage - フォーム画面テンプレート', () => {
    it('Given タイトル, When レンダリング, Then タイトルが表示される', () => {
      // Act
      render(
        <FormPage title="商品登録" onSubmit={() => {}}>
          <input type="text" name="name" />
        </FormPage>
      );

      // Assert
      expect(screen.getByRole('heading', { name: '商品登録' })).toBeInTheDocument();
    });

    it('Given children, When レンダリング, Then フォームフィールドが表示される', () => {
      // Act
      render(
        <FormPage title="登録" onSubmit={() => {}}>
          <input type="text" name="name" aria-label="名前" />
        </FormPage>
      );

      // Assert
      expect(screen.getByRole('textbox', { name: '名前' })).toBeInTheDocument();
    });

    it('Given submitLabel, When レンダリング, Then 送信ボタンにラベルが設定される', () => {
      // Act
      render(
        <FormPage title="登録" onSubmit={() => {}} submitLabel="保存する">
          <input type="text" name="name" />
        </FormPage>
      );

      // Assert
      expect(screen.getByRole('button', { name: '保存する' })).toBeInTheDocument();
    });

    it('Given loading=true, When レンダリング, Then 送信ボタンが無効化される', () => {
      // Act
      render(
        <FormPage title="登録" onSubmit={() => {}} loading={true}>
          <input type="text" name="name" />
        </FormPage>
      );

      // Assert
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
