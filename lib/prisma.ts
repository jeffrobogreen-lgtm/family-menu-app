import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Postgres via Vercel's "Prisma Postgres" marketplace database (switched from local SQLite
// on 2026-08-24 — see schema.prisma's datasource comment). Prisma Postgres hands out a
// plain postgres:// connection string, so the standard node-postgres driver adapter
// (@prisma/adapter-pg) is the right one here — no WebSocket polyfill needed, that was only
// required for Neon's serverless driver, which this app briefly (and incorrectly) assumed
// was the database Vercel had provisioned. Corrected on 2026-08-26 once the dashboard
// showed the database is actually Vercel's own "Prisma Postgres" product.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
