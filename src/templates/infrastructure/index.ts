/**
 * インフラストラクチャテンプレート エクスポート
 */

// リポジトリ
export {
  createInMemoryStore,
  createUserBasedStore,
  createCrudRepository,
  generateId,
} from './repository';
export type {
  BaseEntity,
  PaginationParams,
  FilterParams,
} from './repository';

// セッション管理
export {
  getServerSession,
  createServerSession,
  destroyServerSession,
  getDemoUserName,
  createSessionManager,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  demoUsers,
} from './session';
export type {
  SessionData,
  UserTypeConfig,
  SessionManagerConfig,
} from './session';

// テストリセット
export {
  createResetHandler,
  resetRegistry,
} from './test-reset';
export type {
  ResetFunction,
  ResetResult,
  CreateResetHandlerOptions,
} from './test-reset';
