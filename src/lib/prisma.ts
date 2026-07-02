import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");

function createPrisma() {
  try {
    // In production prefer a remote DB via DATABASE_URL (e.g. Postgres).
    // If DATABASE_URL is provided and not a file: URL, instantiate default PrismaClient.
    if (process.env.NODE_ENV === "production") {
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl && !dbUrl.startsWith("file:")) {
        return new PrismaClient();
      }
    }

    // Default local development: use better-sqlite3 adapter with local file
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    return new PrismaClient({ adapter });
  } catch (err) {
    console.error("Prisma initialization error:", err);
    throw new Error(
      "Prisma failed to initialize. On serverless hosts (e.g. Vercel) SQLite file access may not be available. " +
        "Use a hosted database and set DATABASE_URL, or deploy to an environment that supports SQLite. Original error: " +
        (err instanceof Error ? err.message : String(err))
    );
  }
}

let prismaInstance: undefined | ReturnType<typeof createPrisma>;

const handler: ProxyHandler<object> = {
  get(_, prop) {
    if (!prismaInstance) {
      prismaInstance = createPrisma();
      if (process.env.NODE_ENV !== "production") {
        // expose for REPL / dev to avoid creating multiple clients
        (global as any).prismaGlobal = prismaInstance;
      }
    }
    // @ts-ignore - forward property access to the real client
    return (prismaInstance as any)[prop];
  },
  apply(_, thisArg, args) {
    if (!prismaInstance) prismaInstance = createPrisma();
    // @ts-ignore
    return (prismaInstance as any).apply(thisArg, args);
  },
};

const prismaProxy = new Proxy({}, handler) as unknown as ReturnType<typeof createPrisma>;

export default prismaProxy;
