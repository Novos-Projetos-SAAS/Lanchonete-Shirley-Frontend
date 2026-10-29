import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"], restoreMocks: true, css: false, exclude: ["tests/e2e/**", "tests/e2e-readonly/**", "tests/e2e-test-api/**", "node_modules/**"] },
});

