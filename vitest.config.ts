import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
    },
    include: ["apps/**/*.test.ts", "packages/**/*.test.ts", "tests/integration/**/*.test.ts"],
    restoreMocks: true,
    testTimeout: 10_000,
  },
});
