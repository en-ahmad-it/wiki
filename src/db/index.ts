import assert from "node:assert";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

import "dotenv/config";
assert(
  process.env.DATABASE_URL,
  "DATABASE_URL is not set in the environment variables",
);

// Export the raw sql client in case callers need to run raw queries (e.g. adjust sequences after seeding)

export const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

export default db;
