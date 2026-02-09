/**
 * インメモリカートリポジトリ
 * デモ・テスト用
 *
 * 注意: Next.js開発モードではHMRによりモジュールが再読み込みされるため、
 * グローバル変数を使用してデータを保持しています。
 */
import type { Cart, CartItem } from '@/contracts/cart';
import type { CartRepository, ProductFetcher } from '@/contracts/cart';
import { productRepository } from './product';

// グローバル変数の型定義（HMR対策）
declare global {
  // eslint-disable-next-line no-var
  var __cartStore: Map<string, Cart> | undefined;
}

// インメモリストア（userId -> Cart）
// HMR対策：グローバル変数を使用してデータを保持
const carts = globalThis.__cartStore ?? new Map<string, Cart>();
if (!globalThis.__cartStore) {
  globalThis.__cartStore = carts;
}

function generateId(): string {
  return crypto.randomUUID();
}

function calculateCart(items: CartItem[]): { subtotal: number; itemCount: number } {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, itemCount };
}

export const cartRepository: CartRepository = {
  async findByUserId(userId) {
    return carts.get(userId) || null;
  },

  async create(userId) {
    const now = new Date();
    const cart: Cart = {
      id: generateId(),
      userId,
      items: [],
      subtotal: 0,
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    carts.set(userId, cart);
    return cart;
  },

  async addItem(userId, item) {
    let cart = carts.get(userId);
    if (!cart) {
      cart = await this.create(userId);
    }

    const existingIndex = cart.items.findIndex((i) => i.productId === item.productId);

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += item.quantity;
    } else {
      cart.items.push({
        ...item,
        addedAt: new Date(),
      });
    }

    const { subtotal, itemCount } = calculateCart(cart.items);
    cart.subtotal = subtotal;
    cart.itemCount = itemCount;
    cart.updatedAt = new Date();

    carts.set(userId, cart);
    return cart;
  },

  async updateItemQuantity(userId, productId, quantity) {
    const cart = carts.get(userId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const item = cart.items.find((i) => i.productId === productId);
    if (!item) {
      throw new Error('Item not found');
    }

    item.quantity = quantity;

    const { subtotal, itemCount } = calculateCart(cart.items);
    cart.subtotal = subtotal;
    cart.itemCount = itemCount;
    cart.updatedAt = new Date();

    carts.set(userId, cart);
    return cart;
  },

  async removeItem(userId, productId) {
    const cart = carts.get(userId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    cart.items = cart.items.filter((i) => i.productId !== productId);

    const { subtotal, itemCount } = calculateCart(cart.items);
    cart.subtotal = subtotal;
    cart.itemCount = itemCount;
    cart.updatedAt = new Date();

    carts.set(userId, cart);
    return cart;
  },
};

export const productFetcher: ProductFetcher = {
  async findById(productId) {
    const product = await productRepository.findById(productId);
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: product.stock,
    };
  },
};

// カートクリア用のヘルパー
export function clearCart(userId: string): void {
  const cart = carts.get(userId);
  if (cart) {
    cart.items = [];
    cart.subtotal = 0;
    cart.itemCount = 0;
    cart.updatedAt = new Date();
  }
}

// テスト用：ストア全体をリセット
export function resetCartStore(): void {
  carts.clear();
}
