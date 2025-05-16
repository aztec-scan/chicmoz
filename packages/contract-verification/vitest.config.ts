import { defineConfig } from "vitest/dist/config.js";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/build/**"],
    silent: false,
  },
});
