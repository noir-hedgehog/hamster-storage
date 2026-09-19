import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    env: { DATABASE_PATH: ':memory:' },
    globals: true,
    environment: 'node',
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
