import { defineConfig } from "vitest/config";

/**
 * Tests live in `test/` (outside `src/`, so `tsc` never builds them).
 *
 * `test/**\/*.int.test.ts` touch a real database and run only when
 * WHATSAPP_TEST_DATABASE_URL points at a THROWAWAY copy (see README →
 * "WhatsApp assistant → Testing"). Meta and Anthropic are always mocked.
 */
const testDb = process.env.WHATSAPP_TEST_DATABASE_URL;

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 60_000,
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "error",
      // Fixed test-only key — never used outside the test process.
      WHATSAPP_ENCRYPTION_KEY: "dGVzdC1rZXktZm9yLXdoYXRzYXBwLXRlc3RzLTMyYiE=",
      PUBLIC_API_BASE_URL: "https://api.example.test",
      ...(testDb ? { DATABASE_URL: testDb } : {}),
    },
    onConsoleLog: (log) => !log.startsWith("prisma:query"),
  },
});
