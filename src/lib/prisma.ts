import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";

const defaultPoolMax = process.env.NODE_ENV === "production" ? 5 : 10;

function createPostgresPool(connectionString: string) {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  const sslAccept = url.searchParams.get("sslaccept");
  const isSupabaseHost =
    url.hostname.endsWith(".supabase.co") || url.hostname.endsWith(".pooler.supabase.com");
  const configuredPoolMax = Number(process.env.DATABASE_POOL_MAX);
  const poolMax =
    Number.isFinite(configuredPoolMax) && configuredPoolMax > 0 ? configuredPoolMax : defaultPoolMax;
  const config: PoolConfig = {
    connectionString,
    max: poolMax,
  };

  if (sslMode !== "disable" && (sslMode || isSupabaseHost)) {
    config.ssl = sslAccept === "strict" ? true : { rejectUnauthorized: false };
  }

  return new Pool(config);
}

export function createPrismaClient() {
  try {
    const dbUrl = process.env.DATABASE_URL?.trim();
    if (!dbUrl) {
      throw new Error("DATABASE_URL is required.");
    }

    if (!/^(postgres|postgresql):/i.test(dbUrl)) {
      throw new Error("DATABASE_URL must be a PostgreSQL connection string.");
    }

    const pool = createPostgresPool(dbUrl);
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (err) {
    console.error("Prisma initialization error:", err);
    throw new Error(
      "Prisma failed to initialize. If you are using Supabase/Postgres, ensure DATABASE_URL is set correctly. Original error: " +
        (err instanceof Error ? err.message : String(err))
    );
  }
}

let prismaInstance: undefined | ReturnType<typeof createPrismaClient>;

const handler: ProxyHandler<object> = {
  get(_, prop) {
    if (!prismaInstance) {
      prismaInstance = createPrismaClient();
      if (process.env.NODE_ENV !== "production") {
        (global as any).prismaGlobal = prismaInstance;
      }
    }
    // @ts-ignore - forward property access to the real client
    return (prismaInstance as any)[prop];
  },
};

const prismaProxy = new Proxy({}, handler) as unknown as ReturnType<typeof createPrismaClient>;

export default prismaProxy;
