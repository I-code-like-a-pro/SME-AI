import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // tsconfigPaths lets tests import via the "@/..." alias, matching the app.
  plugins: [tsconfigPaths()],
  test: {
    // Pure logic + API handlers run in Node. Component tests can opt into
    // jsdom per-file with a `// @vitest-environment jsdom` comment.
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx,js,jsx}"],
  },
});
