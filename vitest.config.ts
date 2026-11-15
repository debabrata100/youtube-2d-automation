import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    // Image/FFmpeg-backed tests can exceed the 5 s default on loaded machines.
    testTimeout: 20000,
  },
});
