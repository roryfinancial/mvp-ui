import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";

// The app runs as ESM ("type": "module"); createRequire gives us a CommonJS
// require so we can lazily pull in the Neon driver only on the Postgres path.
const require = createRequire(import.meta.url);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

type LogLevels = ("query" | "error" | "warn")[];
const log: LogLevels =
  process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

// On Postgres (Neon) we drive Prisma through Neon's serverless driver instead of
// the default TCP engine. In a serverless deployment (Vercel) this is markedly
// faster: simple queries go over HTTP fetch (no per-invocation TCP handshake —
// see `poolQueryViaFetch`), while interactive transactions fall back to a
// WebSocket connection. SQLite demo mode keeps the stock client.
function createClient(): PrismaClient {
  if (process.env.DATABASE_PROVIDER !== "postgresql") {
    return new PrismaClient({ log });
  }
  try {
    // Lazy-require so the Neon driver is never pulled into the SQLite demo path.
    const { neonConfig } = require("@neondatabase/serverless");
    const { PrismaNeon } = require("@prisma/adapter-neon");
    // Node serverless lacks a global WebSocket on older runtimes; provide one.
    if (!neonConfig.webSocketConstructor) {
      neonConfig.webSocketConstructor = require("ws");
    }
    // Route non-transactional pool queries over HTTP fetch for low latency.
    neonConfig.poolQueryViaFetch = true;
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
    return new PrismaClient({ adapter, log });
  } catch (err) {
    // Never let a driver-adapter setup problem take the app down — fall back to
    // the default engine, which still works against the same Postgres URL.
    console.error("[prisma] Neon adapter unavailable, using default engine:", err);
    return new PrismaClient({ log });
  }
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
