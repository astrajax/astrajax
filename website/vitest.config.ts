import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // e2e/ holds Playwright specs, which vitest cannot load. Run them with
    // `npm run test:e2e` instead.
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
});
