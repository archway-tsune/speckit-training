/**
 * インメモリ注文リポジトリ
 * デモ・テスト用
 *
 * 注意: Next.js開発モードではHMRによりモジュールが再読み込みされるため、
 * グローバル変数を使用してデータを保持しています。
 */
import type { Order, OrderStatus } from '@/contracts/orders';
import type { Cart } from '@/contracts/cart';
import type { OrderRepository, CartFetcher } from '@/contracts/orders';
import { cartRepository, clearCart } from './cart';

// グローバル変数の型定義（HMR対策）
declare global {
  // eslint-disable-next-line no-var
  var __orderStore: Map<string, Order> | undefined;
}

// インメモリストア
// HMR対策：グローバル変数を使用してデータを保持
const orders = globalThis.__orderStore ?? new Map<string, Order>();
if (!globalThis.__orderStore) {
  globalThis.__orderStore = orders;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const orderRepository: OrderRepository = {
  async findAll(params) {
    let items = Array.from(orders.values());

    if (params.userId) {
      items = items.filter((o) => o.userId === params.userId);
    }

    if (params.status) {
      items = items.filter((o) => o.status === params.status);
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return items.slice(params.offset, params.offset + params.limit);
  },

  async findById(id) {
    return orders.get(id) || null;
  },

  async create(data) {
    const now = new Date();
    const order: Order = {
      id: generateId(),
      userId: data.userId,
      items: data.items,
      totalAmount: data.totalAmount,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };
    orders.set(order.id, order);
    return order;
  },

  async updateStatus(id, status) {
    const order = orders.get(id);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    order.updatedAt = new Date();

    orders.set(id, order);
    return order;
  },

  async count(params) {
    let items = Array.from(orders.values());

    if (params.userId) {
      items = items.filter((o) => o.userId === params.userId);
    }

    if (params.status) {
      items = items.filter((o) => o.status === params.status);
    }

    return items.length;
  },
};

export const cartFetcher: CartFetcher = {
  async getByUserId(userId) {
    return cartRepository.findByUserId(userId);
  },

  async clear(userId) {
    clearCart(userId);
  },
};

// テスト用：注文ストアをリセット
export function resetOrderStore(): void {
  orders.clear();
}
