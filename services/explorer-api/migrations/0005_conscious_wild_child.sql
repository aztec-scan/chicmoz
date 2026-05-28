CREATE TABLE IF NOT EXISTS "tx_public_call_request" (
	"id" varchar PRIMARY KEY NOT NULL,
	"tx_hash" varchar NOT NULL,
	"msg_sender" varchar(66) NOT NULL,
	"contract_address" varchar(66) NOT NULL,
	"is_static_call" boolean NOT NULL,
	"calldata_hash" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "l2_contract_instance_update" RENAME COLUMN "height" TO "timestamp";--> statement-breakpoint
ALTER TABLE "content_commitment" DROP COLUMN IF EXISTS "num_txs";