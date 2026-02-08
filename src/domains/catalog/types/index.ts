/**
 * Catalog ドメイン - 型定義
 */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
