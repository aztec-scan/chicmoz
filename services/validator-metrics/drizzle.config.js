// eslint-disable-next-line no-undef
process.env.L2_NETWORK_ID = "SANDBOX";
import { defineConfig } from "drizzle-kit";
import { dbCredentials } from "@chicmoz-pkg/postgres-helper";

// NOTE: this file is only used by the `drizzle-kit` CLI

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  schema: "./build/src/svcs/database/schema/**/*.js",
  out: "./migrations",
  dbCredentials,
  dialect: "postgresql",
  verbose: true,
  strict: false,
});
