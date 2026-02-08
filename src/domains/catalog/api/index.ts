/**
 * Catalog ドメイン - API エクスポート
 */
export { getProducts, getProductById, NotFoundError, type CatalogContext } from './usecases';

// 管理系ユースケースはサンプル実装を維持
export { createProduct, updateProduct, deleteProduct } from '@/samples/domains/catalog/api';
