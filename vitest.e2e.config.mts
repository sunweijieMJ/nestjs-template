import { defineConfig } from 'vitest/config';
import unitConfig from './vitest.config.mts';

export default defineConfig({
  ...unitConfig,
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    fileParallelism: false,
  },
});
