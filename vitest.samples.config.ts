/**
 * サンプルテスト専用 Vitest 設定
 *
 * 実行コマンド:
 *   pnpm test:unit:samples
 *   pnpm test:integration:samples
 *
 * メインの vitest.config.ts の resolve/plugins 設定を共有しつつ、
 * include を src/samples/ に限定する。
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react()] as any,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['./src/samples/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/foundation': path.resolve(__dirname, './src/foundation'),
      '@/templates': path.resolve(__dirname, './src/templates'),
      '@/samples': path.resolve(__dirname, './src/samples'),
      '@/domains': path.resolve(__dirname, './src/domains'),
      '@/test-utils': path.resolve(__dirname, './tests/utils/index.ts'),
    },
  },
});
