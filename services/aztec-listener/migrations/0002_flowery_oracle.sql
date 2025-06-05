CREATE TABLE IF NOT EXISTS "txs_table" (
	"tx_hash" varchar PRIMARY KEY NOT NULL,
	"fee_payer" varchar(66) NOT NULL,
	"birth_timestamp" timestamp DEFAULT now() NOT NULL,
	"tx_state" varchar NOT NULL
);
--> statement-breakpoint
DROP TABLE "pending_txs";