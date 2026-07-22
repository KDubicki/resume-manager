import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Mirror the tsconfig `@/*` -> `./*` path alias so tests can import runtime
// modules that use it. The trailing-slash key (`@/`) is intentional: it matches
// only `@/...` imports and leaves scoped packages like `@dnd-kit/core` alone.
export default defineConfig({
  resolve: {
    alias: {
      "@/": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
