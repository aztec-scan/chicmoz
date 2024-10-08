/* eslint-disable no-console, @typescript-eslint/no-unsafe-member-access */

import { Logger } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { backOff } from "exponential-backoff";
import pg, { PoolClient } from "pg";
import { dbCredentials } from "../src/environment.js";

class MyLogger implements Logger {
  logQuery(query: string): void {
    console.log("QUERY:", query);
  }
}

const pool = new pg.Pool(dbCredentials);
const db = drizzle(pool, { logger: new MyLogger() });
const retries = 50;

async function printTableList(client: PoolClient) {
  const res = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log("==============================");
  res.rows.forEach((row) => console.log(row.table_name));
  console.log("==============================");
}

async function runMigrations() {
  console.log("🥸 Running migrations...");
  console.log(
    `host: ${dbCredentials.host} port: ${dbCredentials.port} db: ${dbCredentials.database} user: ${dbCredentials.user}`
  );

  const client = await pool.connect();
  try {
    console.log("TABLES BEFORE MIGRATION:");
    await printTableList(client);

    const tryIt = async () =>
      await migrate(db, { migrationsFolder: "./migrations" });

    await backOff(tryIt, {
      maxDelay: 10000,
      numOfAttempts: retries,
      retry: (e, attemptNumber: number) => {
        if (e.code === "ECONNREFUSED") {
          console.log(`Retrying attempt ${attemptNumber} of ${retries}...`);
          return true;
        }
        console.error(e);
        return false;
      },
    });

    console.log("TABLES AFTER MIGRATION:");
    await printTableList(client);

    console.log("🤩 Migrations complete!");
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
