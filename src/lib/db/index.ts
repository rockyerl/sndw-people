import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/sndw_people";

declare global {
  var __dbPool: Pool | undefined;
  var __dbInstance: NodePgDatabase<typeof schema> | undefined;
}

const pool =
  global.__dbPool ||
  new Pool({
    connectionString,
    max: 20, // Max concurrent client connections in pool
    min: 2,  // Warm connections ready to serve immediate queries without handshake delay
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

// Singleton Pool & Drizzle DB instance
global.__dbPool = pool;
export const db = global.__dbInstance || drizzle(pool, { schema });
global.__dbInstance = db;

export { pool };
