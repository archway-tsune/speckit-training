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
    include: ['./tests/**/*.test.{ts,tsx}', './src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        // App pages are E2E tested
        'src/app/**',
        // Infrastructure repositories are integration/E2E tested
        'src/infrastructure/**',
        // Index files (re-exports only)
        'src/**/index.ts',
        // Template layouts (Client Components, E2E tested)
        'src/templates/ui/layouts/**',
        // Template auth pages (Client Components, E2E tested)
        'src/templates/ui/pages/login.tsx',
        'src/templates/ui/pages/logout.tsx',
        // Template API auth handlers (integration tested)
        'src/templates/api/auth/**',
        // Template infrastructure (integration tested)
        'src/templates/infrastructure/**',
        // Template events (browser-only, E2E tested)
        'src/templates/ui/utils/events.ts',
        // Contract types (no logic)
        'src/contracts/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
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
