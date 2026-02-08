/**
 * カートドメイン — コントラクト・ユースケース単体テスト
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi } from 'vitest';
import {
  CartItemSchema,
  CartSchema,
  AddToCartInputSchema,
  UpdateCartItemInputSchema,
  RemoveFromCartInputSchema,
  GetCartInputSchema,
  type Cart,
  type CartItem,
  type CartRepository,
  type ProductFetcher,
} from '@/contracts/cart';
import { addToCart, getCart, updateCartItem, removeFromCart, NotFoundError, CartItemNotFoundError, type CartContext } from '@/domains/cart/api';
import type { Session } from '@/foundation/auth/session';

// ─────────────────────────────────────────────────────────────────
// Phase 2: コントラクトバリデーションテスト (T003)
// ─────────────────────────────────────────────────────────────────

describe('コントラクト: CartItemSchema', () => {
  const validItem = {
    productId: '550e8400-e29b-41d4-a716-446655440000',
    productName: 'テスト商品',
    price: 1000,
    imageUrl: 'https://example.com/image.jpg',
    quantity: 2,
    addedAt: new Date(),
  };

  it('有効なカートアイテムを受け入れること', () => {
    const result = CartItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productId).toBe(validItem.productId);
      expect(result.data.quantity).toBe(2);
      expect(result.data.price).toBe(1000);
    }
  });

  it('productId が UUID でない場合バリデーションエラーになること', () => {
    const result = CartItemSchema.safeParse({ ...validItem, productId: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('price が負の値の場合バリデーションエラーになること', () => {
    const result = CartItemSchema.safeParse({ ...validItem, price: -100 });
    expect(result.success).toBe(false);
  });

  it('price が0の場合受け入れられること', () => {
    const result = CartItemSchema.safeParse({ ...validItem, price: 0 });
    expect(result.success).toBe(true);
  });

  it('quantity が0以下の場合バリデーションエラーになること', () => {
    const result = CartItemSchema.safeParse({ ...validItem, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('quantity が1の場合受け入れられること', () => {
    const result = CartItemSchema.safeParse({ ...validItem, quantity: 1 });
    expect(result.success).toBe(true);
  });

  it('imageUrl が省略可能であること', () => {
    const { imageUrl, ...withoutImage } = validItem;
    const result = CartItemSchema.safeParse(withoutImage);
    expect(result.success).toBe(true);
  });
});

describe('コントラクト: AddToCartInputSchema', () => {
  it('有効な入力（productId + quantity）を受け入れること', () => {
    const result = AddToCartInputSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.data.quantity).toBe(2);
    }
  });

  it('productId が必須であること', () => {
    const result = AddToCartInputSchema.safeParse({ quantity: 1 });
    expect(result.success).toBe(false);
  });

  it('productId が UUID でない場合エラーになること', () => {
    const result = AddToCartInputSchema.safeParse({
      productId: 'invalid-id',
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });

  it('quantity が未指定の場合デフォルト1になること', () => {
    const result = AddToCartInputSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });

  it('quantity が0以下の場合エラーになること', () => {
    const result = AddToCartInputSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('コントラクト: UpdateCartItemInputSchema', () => {
  it('有効な入力（productId + quantity）を受け入れること', () => {
    const result = UpdateCartItemInputSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 5,
    });
    expect(result.success).toBe(true);
  });

  it('quantity が1未満の場合エラーになること', () => {
    const result = UpdateCartItemInputSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('quantity が小数の場合エラーになること', () => {
    const result = UpdateCartItemInputSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 2.5,
    });
    expect(result.success).toBe(false);
  });
});

describe('コントラクト: RemoveFromCartInputSchema', () => {
  it('有効な productId を受け入れること', () => {
    const result = RemoveFromCartInputSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('productId が UUID でない場合エラーになること', () => {
    const result = RemoveFromCartInputSchema.safeParse({
      productId: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('コントラクト: GetCartInputSchema', () => {
  it('空オブジェクトを受け入れること', () => {
    const result = GetCartInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// ヘルパー関数
// ─────────────────────────────────────────────────────────────────

function createMockSession(role: 'buyer' | 'admin' = 'buyer'): Session {
  return {
    userId: '550e8400-e29b-41d4-a716-446655440100',
    role,
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function createMockCart(userId: string, items: CartItem[] = []): Cart {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    id: '550e8400-e29b-41d4-a716-446655440200',
    userId,
    items,
    subtotal,
    itemCount,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createMockRepository(): CartRepository {
  return {
    findByUserId: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(async (userId: string) => createMockCart(userId)),
    addItem: vi.fn().mockImplementation(async (userId: string, item: Omit<CartItem, 'addedAt'>) => {
      return createMockCart(userId, [{ ...item, addedAt: new Date() }]);
    }),
    updateItemQuantity: vi.fn(),
    removeItem: vi.fn(),
  };
}

function createMockProductFetcher(): ProductFetcher {
  return {
    findById: vi.fn().mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'テスト商品',
      price: 1000,
      imageUrl: 'https://example.com/image.jpg',
    }),
  };
}

// ─────────────────────────────────────────────────────────────────
// Phase 3: ユースケース addToCart 単体テスト (T006)
// ─────────────────────────────────────────────────────────────────

describe('ユースケース: addToCart', () => {
  it('商品をカートに追加できること（正常系）', async () => {
    const repo = createMockRepository();
    const fetcher = createMockProductFetcher();
    const context: CartContext = {
      session: createMockSession('buyer'),
      repository: repo,
      productFetcher: fetcher,
    };

    const result = await addToCart(
      { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 1 },
      context
    );

    expect(result).toBeDefined();
    expect(fetcher.findById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001');
    expect(repo.addItem).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440100',
      expect.objectContaining({
        productId: '550e8400-e29b-41d4-a716-446655440001',
        productName: 'テスト商品',
        price: 1000,
        quantity: 1,
      })
    );
  });

  it('同一商品を再度追加した場合リポジトリの addItem が呼ばれること', async () => {
    const existingItem: CartItem = {
      productId: '550e8400-e29b-41d4-a716-446655440001',
      productName: 'テスト商品',
      price: 1000,
      imageUrl: 'https://example.com/image.jpg',
      quantity: 1,
      addedAt: new Date(),
    };
    const repo = createMockRepository();
    (repo.findByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      createMockCart('550e8400-e29b-41d4-a716-446655440100', [existingItem])
    );
    (repo.addItem as ReturnType<typeof vi.fn>).mockResolvedValue(
      createMockCart('550e8400-e29b-41d4-a716-446655440100', [
        { ...existingItem, quantity: 3 },
      ])
    );
    const fetcher = createMockProductFetcher();
    const context: CartContext = {
      session: createMockSession('buyer'),
      repository: repo,
      productFetcher: fetcher,
    };

    const result = await addToCart(
      { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 2 },
      context
    );

    expect(repo.addItem).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440100',
      expect.objectContaining({ quantity: 2 })
    );
  });

  it('存在しない商品の場合 NotFoundError がスローされること', async () => {
    const repo = createMockRepository();
    const fetcher = createMockProductFetcher();
    (fetcher.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const context: CartContext = {
      session: createMockSession('buyer'),
      repository: repo,
      productFetcher: fetcher,
    };

    await expect(
      addToCart(
        { productId: '550e8400-e29b-41d4-a716-446655440099', quantity: 1 },
        context
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('quantity が未指定の場合デフォルト1で追加されること', async () => {
    const repo = createMockRepository();
    const fetcher = createMockProductFetcher();
    const context: CartContext = {
      session: createMockSession('buyer'),
      repository: repo,
      productFetcher: fetcher,
    };

    await addToCart(
      { productId: '550e8400-e29b-41d4-a716-446655440001' },
      context
    );

    expect(repo.addItem).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ quantity: 1 })
    );
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 4: ユースケース getCart 単体テスト (T013)
// ─────────────────────────────────────────────────────────────────

describe('ユースケース: getCart', () => {
  it('既存カートを取得できること', async () => {
    const existingItems: CartItem[] = [
      {
        productId: '550e8400-e29b-41d4-a716-446655440001',
        productName: 'テスト商品A',
        price: 1000,
        imageUrl: 'https://example.com/a.jpg',
        quantity: 2,
        addedAt: new Date(),
      },
    ];
    const repo = createMockRepository();
    (repo.findByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      createMockCart('550e8400-e29b-41d4-a716-446655440100', existingItems)
    );
    const fetcher = createMockProductFetcher();
    const context: CartContext = {
      session: createMockSession('buyer'),
      repository: repo,
      productFetcher: fetcher,
    };

    const result = await getCart({}, context);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].productName).toBe('テスト商品A');
    expect(result.items[0].price).toBe(1000);
    expect(result.items[0].quantity).toBe(2);
    expect(result.subtotal).toBe(2000);
  });

  it('カート未作成時に空カートを自動作成すること', async () => {
    const repo = createMockRepository();
    const fetcher = createMockProductFetcher();
    const context: CartContext = {
      session: createMockSession('buyer'),
      repository: repo,
      productFetcher: fetcher,
    };

    const result = await getCart({}, context);

    expect(repo.findByUserId).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440100');
    expect(repo.create).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440100');
    expect(result.items).toEqual([]);
    expect(result.subtotal).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 5: ユースケース updateCartItem 単体テスト (T022)
// ─────────────────────────────────────────────────────────────────

describe('ユースケース: updateCartItem', () => {
  const existingItem: CartItem = {
    productId: '550e8400-e29b-41d4-a716-446655440001',
    productName: 'テスト商品',
    price: 1000,
    imageUrl: 'https://example.com/image.jpg',
    quantity: 2,
    addedAt: new Date(),
  };

  it('カートアイテムの数量を更新できること', async () => {
    const repo = createMockRepository();
    const userId = '550e8400-e29b-41d4-a716-446655440100';
    (repo.findByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      createMockCart(userId, [existingItem])
    );
    (repo.updateItemQuantity as ReturnType<typeof vi.fn>).mockResolvedValue(
      createMockCart(userId, [{ ...existingItem, quantity: 5 }])
    );
    const fetcher = createMockProductFetcher();
    const context: CartContext = {
      session: createMockSession('buyer'),
      repository: repo,
      productFetcher: fetcher,
    };

    const result = await updateCartItem(
      { productId: existingItem.productId, quantity: 5 },
      context
    );

    expect(repo.updateItemQuantity).toHaveBeenCalledWith(
      userId,
      existingItem.productId,
      5
    );
  });

  it('存在しないカートで更新すると CartItemNotFoundError がスローされること', async () => {
    const repo = createMockRepository();
    const fetcher = createMockProductFetcher();
    const context: CartContext = {
      session: createMockSession('buyer'),
      repository: repo,
      productFetcher: fetcher,
    };

    await expect(
      updateCartItem(
        { productId: '550e8400-e29b-41d4-a716-446655440001', quantity: 5 },
        context
      )
    ).rejects.toThrow(CartItemNotFoundError);
  });

  it('存在しないアイテムで更新すると CartItemNotFoundError がスローされること', async () => {
    const repo = createMockRepository();
    const userId = '550e8400-e29b-41d4-a716-446655440100';
    (repo.findByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      createMockCart(userId, [existingItem])
    );
    const fetcher = createMockProductFetcher();
    const context: CartContext = {
      session: createMockSession('buyer'),
      repository: repo,
      productFetcher: fetcher,
    };

    await expect(
      updateCartItem(
        { productId: '550e8400-e29b-41d4-a716-446655440099', quantity: 5 },
        context
      )
    ).rejects.toThrow(CartItemNotFoundError);
  });
});

// ─────────────────────────────────────────────────────────────────
// Phase 6: ユースケース removeFromCart 単体テスト (T029)
// ─────────────────────────────────────────────────────────────────

describe('ユースケース: removeFromCart', () => {
  const existingItem: CartItem = {
    productId: '550e8400-e29b-41d4-a716-446655440001',
    productName: 'テスト商品',
    price: 1000,
    imageUrl: 'https://example.com/image.jpg',
    quantity: 2,
    addedAt: new Date(),
  };

  it('カートから商品を削除できること', async () => {
    const repo = createMockRepository();
    const userId = '550e8400-e29b-41d4-a716-446655440100';
    (repo.findByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      createMockCart(userId, [existingItem])
    );
    (repo.removeItem as ReturnType<typeof vi.fn>).mockResolvedValue(
      createMockCart(userId, [])
    );
    const fetcher = createMockProductFetcher();
    const context: CartContext = {
      session: createMockSession('buyer'),
      repository: repo,
      productFetcher: fetcher,
    };

    const result = await removeFromCart(
      { productId: existingItem.productId },
      context
    );

    expect(repo.removeItem).toHaveBeenCalledWith(
      userId,
      existingItem.productId
    );
    expect(result.items).toEqual([]);
  });

  it('存在しないカートで削除すると CartItemNotFoundError がスローされること', async () => {
    const repo = createMockRepository();
    const fetcher = createMockProductFetcher();
    const context: CartContext = {
      session: createMockSession('buyer'),
      repository: repo,
      productFetcher: fetcher,
    };

    await expect(
      removeFromCart(
        { productId: '550e8400-e29b-41d4-a716-446655440001' },
        context
      )
    ).rejects.toThrow(CartItemNotFoundError);
  });

  it('存在しないアイテムで削除すると CartItemNotFoundError がスローされること', async () => {
    const repo = createMockRepository();
    const userId = '550e8400-e29b-41d4-a716-446655440100';
    (repo.findByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      createMockCart(userId, [existingItem])
    );
    const fetcher = createMockProductFetcher();
    const context: CartContext = {
      session: createMockSession('buyer'),
      repository: repo,
      productFetcher: fetcher,
    };

    await expect(
      removeFromCart(
        { productId: '550e8400-e29b-41d4-a716-446655440099' },
        context
      )
    ).rejects.toThrow(CartItemNotFoundError);
  });
});
