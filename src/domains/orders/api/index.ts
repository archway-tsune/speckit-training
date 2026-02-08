/**
 * Orders ドメイン - API 暫定スキャフォールド
 * サンプル実装の再エクスポート（本番実装で置き換え予定）
 */
export {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  NotFoundError,
  EmptyCartError,
  InvalidStatusTransitionError,
} from '@/samples/domains/orders/api';
