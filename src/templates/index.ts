/**
 * アーキテクチャテンプレート メインエクスポート
 *
 * このパッケージは、ECサイトアーキテクチャの再利用可能なテンプレートを提供します。
 *
 * 含まれるテンプレート:
 *
 * 1. API テンプレート
 *    - 認証API（ログイン、ログアウト、セッション）
 *    - ユースケースハンドラー
 *    - DTOスキーマ
 *
 * 2. UI テンプレート
 *    - ページ（一覧、詳細、フォーム、ログイン、ログアウト）
 *    - レイアウト（管理者、購入者）
 *    - コンポーネント（ヘッダー、フッター、フォーム、ステータス）
 *    - ユーティリティ（イベント）
 *
 * 3. インフラストラクチャ テンプレート
 *    - インメモリリポジトリ
 *    - セッション管理
 *    - テストリセット
 *
 * 4. テスト テンプレート
 *    - ユニットテスト
 *    - 統合テスト
 *    - E2Eテスト
 */

// ─────────────────────────────────────────────────────────────────
// API テンプレート
// ─────────────────────────────────────────────────────────────────

// 認証API
export {
  createLoginHandler,
  LoginInputSchema,
  demoAuthenticator,
  createLogoutHandler,
  createSessionHandler,
} from './api/auth';
export type {
  LoginInput,
  AuthResult,
  Authenticator,
  SessionCreator,
  CreateLoginHandlerOptions,
  SessionDestroyer,
  CreateLogoutHandlerOptions,
  SessionData as AuthSessionData,
  SessionGetter,
  CreateSessionHandlerOptions,
} from './api/auth';

// ─────────────────────────────────────────────────────────────────
// UI テンプレート
// ─────────────────────────────────────────────────────────────────

// ページ
export {
  ListPage,
  DetailPage,
  FormPage,
  LoginPage,
  LogoutPage,
  isAdmin,
  isBuyer,
  allowAny,
} from './ui/pages';
export type {
  ListPageProps,
  DetailPageProps,
  FormPageProps,
  LoginPageProps,
  LogoutPageProps,
} from './ui/pages';

// レイアウト
export { AdminLayout, BuyerLayout } from './ui/layouts';
export type {
  AdminLayoutProps,
  BuyerLayoutProps,
  AutoLoginConfig,
} from './ui/layouts';

// フォームコンポーネント
export { FormField, TextInput, TextArea, Select } from './ui/components/form';
export type {
  FormFieldProps,
  TextInputProps,
  TextAreaProps,
  SelectProps,
} from './ui/components/form';

// ステータスコンポーネント
export { Loading } from './ui/components/status/Loading';
export { Error } from './ui/components/status/Error';
export { Empty } from './ui/components/status/Empty';

// レイアウトコンポーネント
export { Header } from './ui/components/layout/Header';
export { Footer } from './ui/components/layout/Footer';
export { Layout } from './ui/components/layout/Layout';

// 認証コンポーネント
export { Forbidden } from './ui/components/auth/Forbidden';

// イベントユーティリティ
export {
  dispatchCustomEvent,
  subscribeCustomEvent,
  dispatchCartUpdated,
  subscribeCartUpdated,
  dispatchOrderCompleted,
  subscribeOrderCompleted,
  CART_UPDATED_EVENT,
  ORDER_COMPLETED_EVENT,
  LOGIN_EVENT,
  LOGOUT_EVENT,
} from './ui/utils';
export type {
  EventHandler,
  CartUpdatedPayload,
  OrderCompletedPayload,
} from './ui/utils';

// ─────────────────────────────────────────────────────────────────
// インフラストラクチャ テンプレート
// ─────────────────────────────────────────────────────────────────

export {
  createInMemoryStore,
  createUserBasedStore,
  createCrudRepository,
  generateId,
  getServerSession,
  createServerSession,
  destroyServerSession,
  getDemoUserName,
  createSessionManager,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  demoUsers,
  createResetHandler,
  resetRegistry,
} from './infrastructure';
export type {
  BaseEntity,
  PaginationParams,
  FilterParams,
  SessionData as InfraSessionData,
  UserTypeConfig,
  SessionManagerConfig,
  ResetFunction,
  ResetResult,
  CreateResetHandlerOptions,
} from './infrastructure';
