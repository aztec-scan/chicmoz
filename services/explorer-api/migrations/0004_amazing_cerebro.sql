CREATE TABLE IF NOT EXISTS "dropped_tx" (
	"tx_hash" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp NOT NULL,
	"dropped_at" timestamp NOT NULL
);
