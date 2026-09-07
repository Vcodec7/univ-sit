import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  pgPool: Pool;
};

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://sochi:sochi@127.0.0.1:5432/sochi_portal?schema=public";

const poolMax = Math.max(1, Math.min(8, Number(process.env.YP_PG_POOL_MAX || 4) || 4));

const pool =
  globalForPrisma.pgPool ||
  new Pool({
    connectionString,
    max: poolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
  });

globalForPrisma.pgPool = pool;

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error"],
  });

globalForPrisma.prisma = prisma;
