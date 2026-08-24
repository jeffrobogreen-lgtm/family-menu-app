import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved connection config out of schema.prisma and into this file.
// See prisma/schema.prisma for why: the generator there points here for the
// datasource, and lib/prisma.ts + prisma/seed.ts use the same DATABASE_URL
// via the @prisma/adapter-better-sqlite3 driver adapter.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
