# Foundation - 共通アーキテクチャ基盤

ECサイト向けアーキテクチャ基盤の共通機能を提供するモジュール群。

## 構成

```
src/foundation/
├── auth/           # 認証・認可・セッション管理
│   ├── session.ts  # セッション管理
│   ├── authorize.ts # RBAC認可
│   └── csrf.ts     # CSRF対策
├── errors/         # エラー処理
│   ├── types.ts    # エラーコード定義
│   ├── handler.ts  # 共通エラーハンドラ
│   └── mask.ts     # クライアント向けマスキング
├── logging/        # ログ・監査
│   ├── logger.ts   # ログ出力（個人情報除外）
│   └── audit.ts    # 監査フック
└── validation/     # バリデーション
    └── runtime.ts  # Zodベース runtime validation
```

## 使い方

### 認証・セッション管理

```typescript
import { createSession, getSession, requireSession } from '@/foundation/auth/session';

// セッション作成
const session = await createSession({
  userId: 'user-uuid',
  role: 'buyer', // or 'admin'
});

// セッション検証（無効時はUnauthorizedErrorをスロー）
const validSession = requireSession(session);
```

### 認可（RBAC）

```typescript
import { authorize, hasRole } from '@/foundation/auth/authorize';

// 認可チェック（失敗時はForbiddenErrorをスロー）
authorize(session, 'admin');

// 複数ロールのいずれかを許可
authorize(session, ['buyer', 'admin']);

// ロール確認（エラーをスローしない）
if (hasRole(session, 'admin')) {
  // admin操作
}
```

### CSRF対策

```typescript
import { generateCsrfToken, requireValidCsrfToken } from '@/foundation/auth/csrf';

// トークン生成
const token = generateCsrfToken(sessionId);

// トークン検証（無効時はCsrfErrorをスロー）
requireValidCsrfToken(sessionId, token);
```

### エラー処理

```typescript
import { createError, handleError, maskErrorForClient } from '@/foundation/errors/handler';

// エラー生成
throw createError('NOT_FOUND', 'リソースが見つかりません');

// バリデーションエラー
throw createError('VALIDATION_ERROR', undefined, [
  { field: 'email', message: 'メールアドレスが無効です' },
]);

// エラー処理
const result = handleError(error);
// result: { code, message, httpStatus, fieldErrors? }

// クライアント向けマスキング
const apiError = maskErrorForClient(error);
// apiError: { code, message, fieldErrors? }
```

### ログ出力

```typescript
import { logger, sanitizeForLog } from '@/foundation/logging/logger';

// 各レベルのログ出力
logger.debug('デバッグ情報', { data });
logger.info('処理完了', { result });
logger.warn('警告', { warning });
logger.error('エラー発生', error);

// 個人情報をサニタイズ
const safeData = sanitizeForLog({ email: 'user@example.com' });
// safeData: { email: '[REDACTED]' }
```

### 監査ログ

```typescript
import { recordAudit, AuditAction, registerAuditHook } from '@/foundation/logging/audit';

// 監査ログ記録
await recordAudit({
  action: AuditAction.CREATE,
  actorId: session.userId,
  targetType: 'Product',
  targetId: 'product-uuid',
  details: { name: '新商品' },
});

// カスタム監査フックを登録
const unregister = registerAuditHook(async (entry) => {
  // 外部システムへ送信など
});
```

### バリデーション

```typescript
import { validate, validateAsync, validateSafe } from '@/foundation/validation/runtime';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  price: z.number().int().min(0),
});

// 同期バリデーション（失敗時はValidationErrorをスロー）
const data = validate(schema, input);

// 非同期バリデーション
const data = await validateAsync(schema, input);

// 安全なバリデーション（エラーをスローしない）
const result = validateSafe(schema, input);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.errors);
}
```

## エラーコード一覧

| コード | 説明 | HTTPステータス |
|--------|------|----------------|
| `UNAUTHORIZED` | 未認証（ログイン必要） | 401 |
| `FORBIDDEN` | 認可失敗（権限不足） | 403 |
| `VALIDATION_ERROR` | 入力検証エラー | 400 |
| `NOT_FOUND` | リソース未存在 | 404 |
| `CONFLICT` | 状態競合 | 409 |
| `INTERNAL_ERROR` | 内部エラー | 500 |

## ロール階層

- `admin`: 管理者（`buyer` の権限を包含）
- `buyer`: 購入者

## 設計原則

1. **セキュリティ最優先**: 認可の二重防御、エラーマスキング、個人情報除外
2. **型安全**: TypeScript strict mode、Zod による runtime validation
3. **テスト容易性**: 依存性注入、モック可能な設計
4. **一貫性**: 統一されたエラーコード、ログフォーマット
