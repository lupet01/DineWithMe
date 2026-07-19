import { defineConfig } from "vitest/config";
import { config as loadEnv } from "dotenv";
import path from "path";

// Prisma Client doesn't auto-load .env the way the Prisma CLI does — without
// this, DATABASE_URL is never set for tests that construct a PrismaClient
// directly (which is every test in tests/, since they exercise real
// repository/service code against the actual dev database).
loadEnv({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  test: {
    environment: "node",
  },
});
