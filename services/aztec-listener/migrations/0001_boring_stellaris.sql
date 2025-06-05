CREATE TABLE IF NOT EXISTS "pending_txs" (
	"tx_hash" varchar PRIMARY KEY NOT NULL,
	"fee_payer" varchar(66) NOT NULL,
	"birth_timestamp" timestamp DEFAULT now() NOT NULL
);
