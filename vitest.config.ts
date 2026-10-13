import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./test/mocks/server-only.ts"),
    },
  },
  test: {
    include: ["test/unit/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
  },
});
