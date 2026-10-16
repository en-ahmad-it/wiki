// import path from "node:path";
// import { defineConfig } from "vitest/config";

// export default defineConfig({
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//       "server-only": path.resolve(__dirname, "./test/mocks/server-only.ts"),
//     },
//   },
//   test: {
//     include: ["test/unit/**/*.test.ts"],
//     setupFiles: ["./test/setup.ts"],
//   },
// });
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".next", "test/e2e"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./test/mocks/server-only.ts"),
    },
  },
});
