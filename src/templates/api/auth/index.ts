/**
 * 認証APIテンプレート エクスポート
 */
export { createLoginHandler, LoginInputSchema, demoAuthenticator } from './login';
export type { LoginInput, AuthResult, Authenticator, SessionCreator, CreateLoginHandlerOptions } from './login';

export { createLogoutHandler } from './logout';
export type { SessionDestroyer, CreateLogoutHandlerOptions } from './logout';

export { createSessionHandler } from './session';
export type { SessionData, SessionGetter, CreateSessionHandlerOptions } from './session';
