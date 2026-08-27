import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved connection config out of schema.prisma and into this file.
// See prisma/schema.prisma for why: the generator there points here for the
// datasource, and lib/prisma.ts + prisma/seed.ts use the same DATABASE_URL
// via the @prisma/adapter-pg driver adapter (Postgres, via Vercel's "Prisma
// Postgres" product — see schema.prisma's datasource comment for the
// 2026-08-24 switch from SQLite, corrected 2026-08-26 from an initial wrong
// assumption that the database was Neon).
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
