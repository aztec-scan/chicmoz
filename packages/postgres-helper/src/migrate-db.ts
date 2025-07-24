/* eslint-disable no-console */
import { Logger } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { dbCredentials } from "./environment.js";
import { backOff } from "exponential-backoff";
import pg, { PoolClient } from "pg";

class MyLogger implements Logger {
  logQuery(query: string): void {
    console.log("QUERY:", query);
  }
}

const TOTAL_DB_RESET = process.env.TOTAL_DB_RESET === "true";

const retries = 50;

async function printTableList(client: PoolClient, ID: string): Promise<void> {
  const res = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log(`=========== ${ID} ============`);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  res.rows.forEach((row) => console.log(row.table_name));
  console.log("==============================");
}

async function tryMigrate(pool: pg.Pool, db: ReturnType<typeof drizzle>) {
  const client = await pool.connect();
  await printTableList(client, "BEFORE MIGRATION");
  if (TOTAL_DB_RESET) {
    try {
      await dropAllTables(client);
    } catch (e) {
      console.log("🤷‍♂️ Could not drop tables, perhaps already dropped?");
    }
  }

  await migrate(db, { migrationsFolder: "./migrations" });
  await printTableList(client, "AFTER MIGRATION");
  client.release();
  console.log("👌 Client released");
}

async function run(
  dbCredentials: pg.PoolConfig,
  db: ReturnType<typeof drizzle>
) {
  console.log("🥸 Running migrations...");
  console.log(
    `host: ${dbCredentials.host} port: ${dbCredentials.port} db: ${dbCredentials.database} user: ${dbCredentials.user}`
  );
  await backOff(() => tryMigrate(new pg.Pool(dbCredentials), db), {
    maxDelay: 10000,
    numOfAttempts: retries,
    retry: (e, attemptNumber: number) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (e.code === "ECONNREFUSED") {
        console.log(`Retrying attempt ${attemptNumber} of ${retries}...`);
        return true;
      }
      console.error(e);
      return false;
    },
  });
  console.log("🤩 Migrations complete!");
  if (TOTAL_DB_RESET) {console.log("🔥🔥🔥 Total DB reset!");}
}

async function dropAllTables(client: PoolClient) {
  console.log("🔥 Dropping all tables...");
  const res1 = await client.query("DROP SCHEMA public CASCADE");
  console.log(`💣 ${res1.command} ${res1.rowCount}`);
  const res2 = await client.query("CREATE SCHEMA public");
  console.log(`💣 ${res2.command} ${res2.rowCount}`);
  const res3 = await client.query("DROP SCHEMA drizzle CASCADE");
  console.log(`💣 ${res3.command} ${res3.rowCount}`);
}

export async function runMigrations() {
  const pool = new pg.Pool(dbCredentials);
  const db = drizzle(pool, { logger: new MyLogger() });
  try {
    await run(dbCredentials, db);
    await pool.end();
    console.log("👋 Pool closed!");
  } catch (e) {
    console.error(e);
    await pool.end();
    console.log("👋👋 Pool closed!");
    process.exit(1);
  }
}
