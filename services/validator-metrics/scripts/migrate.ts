/* eslint-disable no-console */
import { runMigrations } from "@chicmoz-pkg/postgres-helper";

runMigrations().catch(console.error);
